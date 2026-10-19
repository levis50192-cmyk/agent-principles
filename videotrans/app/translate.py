"""Context-aware subtitle translation with Claude."""
import json
from typing import Callable

from . import config
from .langs import LANGS, name_of

BATCH = 30
CONTEXT_LINES = 4

SYSTEM = (
    "You are a professional audiovisual translator who localizes video dialogue into subtitles and dubbing scripts. "
    "Translate meaning and tone, not word for word. Keep each line roughly as short as the spoken original so it "
    "fits the same time slot when read or dubbed. Keep proper nouns, numbers and units consistent across lines. "
    "Never merge, split, drop or reorder lines. Respond with ONLY a JSON array of strings."
)


class TranslateError(RuntimeError):
    pass


def parse_json_array(text: str) -> list[str]:
    a, b = text.find("["), text.rfind("]")
    if a < 0 or b < a:
        raise ValueError("no JSON array in reply")
    arr = json.loads(text[a:b + 1])
    if not isinstance(arr, list) or not all(isinstance(x, str) for x in arr):
        raise ValueError("reply is not an array of strings")
    return arr


def _client():
    import anthropic

    return anthropic.Anthropic()


def _ask(client, payload: dict, tgt: str) -> list[str]:
    hint = LANGS.get(tgt, {}).get("hint", "")
    system = SYSTEM + (f" Target-language notes: {hint}" if hint else "")
    msg = client.messages.create(
        model=config.CLAUDE_MODEL,
        max_tokens=8000,
        system=system,
        messages=[{"role": "user", "content": json.dumps(payload, ensure_ascii=False)}],
    )
    return parse_json_array("".join(b.text for b in msg.content if getattr(b, "type", "") == "text"))


def translate_lines(lines: list[str], src: str, tgt: str, context: str = "",
                    progress: Callable[[float], None] | None = None, client=None) -> list[str]:
    """Translate `lines` into `tgt`; the result always has the same length as the input."""
    if src == tgt:
        return list(lines)
    client = client or _client()
    out: list[str] = []
    for i in range(0, len(lines), BATCH):
        chunk = lines[i:i + BATCH]
        payload = {
            "task": f"Translate each line from {name_of(src)} to {name_of(tgt)}. "
                    f"Return a JSON array with exactly {len(chunk)} strings.",
            "video_context": context or "(none given)",
            "previous_lines_for_context_only": lines[max(0, i - CONTEXT_LINES):i],
            "lines": chunk,
        }
        result = None
        for _ in range(3):
            try:
                r = _ask(client, payload, tgt)
                if len(r) == len(chunk):
                    result = r
                    break
            except ValueError:
                pass
        if result is None:  # model keeps miscounting: go line by line
            result = []
            for line in chunk:
                p = dict(payload, lines=[line], task=payload["task"].replace(str(len(chunk)), "1"))
                try:
                    r = _ask(client, p, tgt)
                except ValueError:
                    r = []
                if len(r) != 1:
                    raise TranslateError(f"無法翻譯該行: {line!r}")
                result.append(r[0])
        out.extend(s.strip() for s in result)
        if progress:
            progress(min((i + BATCH) / len(lines), 1.0))
    return out
