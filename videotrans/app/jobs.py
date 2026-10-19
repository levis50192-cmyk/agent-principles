"""Job store (JSON on disk) and the background pipeline."""
import json
import shutil
import threading
import time
import traceback
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from . import asr, config, media, translate
from .langs import LANGS
from .render import render_language

_lock = threading.Lock()
_pool = ThreadPoolExecutor(max_workers=1)  # transcription/rendering are CPU/GPU heavy


def job_dir(job_id: str) -> Path:
    if not job_id.isalnum():
        raise KeyError(job_id)
    return config.JOBS_DIR / job_id


def load(job_id: str) -> dict:
    p = job_dir(job_id) / "job.json"
    if not p.exists():
        raise KeyError(job_id)
    return json.loads(p.read_text(encoding="utf-8"))


def save(job: dict) -> None:
    with _lock:
        p = job_dir(job["id"]) / "job.json"
        tmp = p.with_suffix(".tmp")
        tmp.write_text(json.dumps(job, ensure_ascii=False, indent=1), encoding="utf-8")
        tmp.replace(p)


def update(job_id: str, **kw) -> dict:
    job = load(job_id)
    job.update(kw)
    save(job)
    return job


def list_jobs() -> list[dict]:
    jobs = []
    for p in config.JOBS_DIR.glob("*/job.json"):
        j = json.loads(p.read_text(encoding="utf-8"))
        jobs.append({k: j.get(k) for k in ("id", "filename", "created", "status", "message", "targets")})
    return sorted(jobs, key=lambda j: j["created"], reverse=True)


def create(filename: str, options: dict) -> dict:
    job_id = uuid.uuid4().hex[:12]
    job_dir(job_id).mkdir(parents=True)
    job = {"id": job_id, "filename": filename, "created": time.time(), "status": "uploading", "message": "",
           "progress": 0, "targets": options["targets"], "options": options, "segments": [], "renders": {}}
    save(job)
    return job


def delete(job_id: str) -> None:
    shutil.rmtree(job_dir(job_id), ignore_errors=True)


def submit(fn, *args) -> None:
    _pool.submit(_guard, fn, *args)


def _guard(fn, job_id, *args):
    try:
        fn(job_id, *args)
    except Exception as e:  # surface any failure to the UI instead of dying silently
        traceback.print_exc()
        update(job_id, status="error", message=f"{type(e).__name__}: {e}")


def analyze(job_id: str) -> None:
    """Transcribe, then translate into every target language."""
    job = load(job_id)
    d, opt = job_dir(job_id), job["options"]
    src = next(d.glob("source.*"))
    info = media.probe(src)
    update(job_id, status="transcribing", message="擷取音訊…", progress=0, **info)
    if not info["has_audio"]:
        raise RuntimeError("影片沒有音軌,無法辨識語音")
    wav = d / "audio.wav"
    media.extract_audio(src, wav)

    def p1(x):
        update(job_id, progress=round(x * 0.5, 3), message=f"語音辨識中 {x:.0%}")

    lang, segs = asr.transcribe(wav, info["duration"], opt.get("source_lang") or None, p1)
    wav.unlink(missing_ok=True)
    if not segs:
        raise RuntimeError("沒有偵測到語音")
    segments = [{"id": i, "start": s["start"], "end": s["end"], "text": s["text"], "tr": {}} for i, s in enumerate(segs)]
    update(job_id, status="translating", detected_lang=lang, segments=segments, progress=0.5)

    texts = [s["text"] for s in segments]
    for n, tgt in enumerate(opt["targets"]):
        done = n / len(opt["targets"])

        def p2(x, tgt=tgt, done=done):
            update(job_id, progress=round(0.5 + 0.5 * (done + x / len(opt["targets"])), 3),
                   message=f"翻譯成 {LANGS[tgt]['label']} {x:.0%}")

        for s, t in zip(segments, translate.translate_lines(texts, lang, tgt, opt.get("context", ""), p2)):
            s["tr"][tgt] = t
        update(job_id, segments=segments)
    update(job_id, status="review", message="翻譯完成,請校對後輸出", progress=1)
    if opt.get("auto_render"):
        render(job_id, opt["targets"])


def render(job_id: str, langs: list[str]) -> None:
    for lang in langs:
        job = load(job_id)
        o = job["options"]
        job["status"] = "rendering"
        job["message"] = f"輸出 {LANGS[lang]['label']}…"
        job["renders"][lang] = {"status": "running"}
        save(job)
        files = render_language(
            job_dir(job_id), job, lang, dub=o.get("dub", True), burn=o.get("burn", True),
            bilingual=o.get("bilingual", False), voice=o.get("voices", {}).get(lang) or LANGS[lang]["voices"][0],
            original_volume=float(o.get("original_volume", 0.12)))
        job = load(job_id)
        job["renders"][lang] = {"status": "done", "files": files}
        save(job)
    update(job_id, status="done", message="全部完成")
