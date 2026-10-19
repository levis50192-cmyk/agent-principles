"""AI dubbing: edge-tts per segment, time-fitted into the original slots, mixed over the original audio."""
import asyncio
import wave
from pathlib import Path

import numpy as np

from .media import run

SR = 24000
MAX_SPEEDUP = 1.5
MAX_OVERFLOW = 1.0  # seconds a line may run past its slot if the next line starts later


def plan_fit(dur: float, start: float, end: float, next_start: float | None) -> tuple[float, float | None]:
    """Return (speed factor, trim length). Speeds up long speech, borrows silence before the next line."""
    allowed_end = end + MAX_OVERFLOW
    if next_start is not None:
        allowed_end = min(allowed_end, next_start - 0.05)
    allowed = max(allowed_end - start, end - start, 0.2)
    if dur <= allowed:
        return 1.0, None
    speed = min(dur / allowed, MAX_SPEEDUP)
    return speed, (allowed if dur / speed > allowed else None)


async def _synth_all(jobs: list[tuple[str, Path]], voice: str) -> None:
    import edge_tts

    sem = asyncio.Semaphore(4)

    async def one(text: str, out: Path):
        async with sem:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(text, voice).save(str(out))
                    return
                except Exception:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(1.5 * (attempt + 1))

    await asyncio.gather(*(one(t, o) for t, o in jobs))


def _read_wav(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768


def _write_wav(path: Path, data: np.ndarray) -> None:
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(data, -1, 1) * 32767).astype(np.int16).tobytes())


def build_dub_track(segments: list[dict], lang: str, voice: str, duration: float, workdir: Path,
                    synth=_synth_all) -> Path:
    """segments: dicts with start, end and tr[lang]. Returns path to a mono WAV covering the full video."""
    workdir.mkdir(parents=True, exist_ok=True)
    todo = [(i, s) for i, s in enumerate(segments) if s["tr"].get(lang, "").strip()]
    mp3 = {i: workdir / f"{lang}_{i}.mp3" for i, _ in todo}
    asyncio.run(synth([(s["tr"][lang], mp3[i]) for i, s in todo], voice))

    buf = np.zeros(int(duration * SR) + SR, dtype=np.float32)
    for k, (i, s) in enumerate(todo):
        wav = workdir / f"{lang}_{i}.wav"
        run(["ffmpeg", "-y", "-i", str(mp3[i]), "-ac", "1", "-ar", str(SR), str(wav)])
        data = _read_wav(wav)
        nxt = todo[k + 1][1]["start"] if k + 1 < len(todo) else None
        speed, trim = plan_fit(len(data) / SR, s["start"], s["end"], nxt)
        if speed > 1.01:
            fast = workdir / f"{lang}_{i}_fast.wav"
            run(["ffmpeg", "-y", "-i", str(wav), "-filter:a", f"atempo={speed:.3f}", str(fast)])
            data = _read_wav(fast)
        if trim is not None:
            data = data[: int(trim * SR)].copy()
            fade = min(len(data), int(0.05 * SR))
            data[len(data) - fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
        a = int(s["start"] * SR)
        n = min(len(data), len(buf) - a)
        if n > 0:
            buf[a:a + n] += data[:n]
    out = workdir / f"dub_{lang}.wav"
    _write_wav(out, buf)
    return out
