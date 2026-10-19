"""Speech recognition with faster-whisper, regrouped into subtitle-sized segments."""
from pathlib import Path
from typing import Callable

from . import config
from .langs import FROM_WHISPER, WHISPER_CODE

_model = None
STRONG_END = tuple(".?!。！？…")


def _get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        compute = "float16" if config.WHISPER_DEVICE == "cuda" else "int8"
        _model = WhisperModel(config.WHISPER_MODEL, device=config.WHISPER_DEVICE, compute_type=compute)
    return _model


def regroup(words: list[dict], max_dur: float = 6.0, max_chars: int = 84, gap: float = 0.8) -> list[dict]:
    """Merge word timings into subtitle segments split on pauses, length and sentence ends."""
    segs, cur = [], []

    def flush():
        if cur:
            text = "".join(w["word"] for w in cur).strip()
            if text:
                segs.append({"start": round(cur[0]["start"], 3), "end": round(cur[-1]["end"], 3), "text": text})
            cur.clear()

    for w in words:
        if cur:
            too_long = len("".join(x["word"] for x in cur) + w["word"]) > max_chars
            if w["start"] - cur[-1]["end"] > gap or w["end"] - cur[0]["start"] > max_dur or too_long:
                flush()
        cur.append(w)
        if w["word"].rstrip().endswith(STRONG_END):
            flush()
    flush()
    return segs


def transcribe(audio: Path, duration: float, language: str | None = None,
               progress: Callable[[float], None] | None = None) -> tuple[str, list[dict]]:
    """Return (detected_language_code, segments)."""
    model = _get_model()
    code = WHISPER_CODE.get(language, language) if language else None
    it, info = model.transcribe(str(audio), language=code, vad_filter=True, word_timestamps=True,
                                condition_on_previous_text=False)
    words = []
    for seg in it:
        for w in seg.words or []:
            words.append({"start": w.start, "end": w.end, "word": w.word})
        if progress and duration:
            progress(min(seg.end / duration, 1.0))
    lang = language or FROM_WHISPER.get(info.language, info.language)
    return lang, regroup(words)
