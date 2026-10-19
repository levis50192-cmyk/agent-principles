"""End-to-end with real ffmpeg; ASR/TTS/translation are faked (no network needed)."""
import subprocess
import time
import wave

import pytest
from fastapi.testclient import TestClient

from app import asr, config, dub, jobs, translate
from app.main import app


def _video(path):
    subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=blue:s=640x360:d=6", "-f", "lavfi",
                    "-i", "sine=frequency=300:duration=6", "-shortest", "-pix_fmt", "yuv420p", str(path)],
                   check=True, capture_output=True)


def _fake_synth(items, voice):
    import asyncio
    async def go():
        for text, out in items:
            subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", f"sine=frequency=500:duration={0.3 + 0.08 * len(text)}",
                            str(out)], check=True, capture_output=True)
    return go()


@pytest.fixture
def client(monkeypatch, tmp_path):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test")
    monkeypatch.setattr(config, "JOBS_DIR", tmp_path)
    monkeypatch.setattr(asr, "transcribe", lambda *a, **k: ("en", [
        {"start": 0.5, "end": 2.0, "text": "Hello everyone."}, {"start": 2.5, "end": 5.0, "text": "Today we cook."}]))
    monkeypatch.setattr(translate, "_client", lambda: type("C", (), {})())
    monkeypatch.setattr(translate, "_ask", lambda c, p, t: [f"[{t}] {l}" for l in p["lines"]])
    orig = dub.build_dub_track
    monkeypatch.setattr("app.render.build_dub_track", lambda *a, **k: orig(*a, synth=_fake_synth, **k))
    return TestClient(app)


def _wait(c, jid, want):
    for _ in range(120):
        j = c.get(f"/api/jobs/{jid}").json()
        if j["status"] in want:
            return j
        time.sleep(0.5)
    raise AssertionError(j)


def test_full_flow(client, tmp_path):
    src = tmp_path / "in.mp4"
    _video(src)
    r = client.post("/api/jobs", files={"file": ("in.mp4", src.read_bytes(), "video/mp4")},
                    data={"targets": "vi,th", "dub": "true", "burn": "true"})
    assert r.status_code == 200, r.text
    jid = r.json()["id"]
    j = _wait(client, jid, {"review", "error"})
    assert j["status"] == "review", j["message"]
    assert j["segments"][0]["tr"] == {"vi": "[vi] Hello everyone.", "th": "[th] Hello everyone."}

    segs = j["segments"]
    segs[0]["tr"]["vi"] = "Xin chào mọi người."
    assert client.put(f"/api/jobs/{jid}/segments", json=segs).status_code == 200
    assert client.post(f"/api/jobs/{jid}/render", json={"langs": ["vi", "th"], "bilingual": True}).status_code == 200
    j = _wait(client, jid, {"done", "error"})
    assert j["status"] == "done", j["message"]

    for lang in ("vi", "th"):
        f = j["renders"][lang]["files"]
        out = tmp_path / jid / f["video"]
        info = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type", "-of", "csv=p=0", str(out)],
                              capture_output=True, text=True).stdout.split()
        assert sorted(info) == ["audio", "video"]
        assert client.get(f"/api/jobs/{jid}/files/{f['srt']}").status_code == 200
    assert "Xin chào mọi người." in (tmp_path / jid / "subs.vi.srt").read_text(encoding="utf-8")
    assert client.get(f"/api/jobs/{jid}/files/..%2Fjob.json").status_code == 404


def test_rejects_bad_input(client):
    assert client.post("/api/jobs", files={"file": ("x.txt", b"hi")}, data={"targets": "vi"}).status_code == 400
    assert client.post("/api/jobs", files={"file": ("x.mp4", b"hi")}, data={"targets": "xx"}).status_code == 400
