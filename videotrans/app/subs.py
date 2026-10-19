"""Subtitle files (SRT/VTT/ASS) and line wrapping that is safe for Thai/Khmer/Burmese/Lao."""
import math
import unicodedata

from .langs import LANGS


def _ts(t: float, sep: str) -> str:
    ms = round(max(t, 0) * 1000)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}"


def _ass_ts(t: float) -> str:
    cs = round(max(t, 0) * 100)
    h, cs = divmod(cs, 360_000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def to_srt(items: list[tuple[float, float, str]]) -> str:
    return "".join(f"{i}\n{_ts(a, ',')} --> {_ts(b, ',')}\n{t}\n\n" for i, (a, b, t) in enumerate(items, 1))


def to_vtt(items: list[tuple[float, float, str]]) -> str:
    return "WEBVTT\n\n" + "".join(f"{_ts(a, '.')} --> {_ts(b, '.')}\n{t}\n\n" for a, b, t in items)


_LEADING_VOWELS = set("เแโใไ")  # Thai/Lao prefix vowels must stay with the next consonant
_THAI_TOKENIZER = None


def _tokens(text: str, lang: str) -> list[str]:
    if LANGS.get(lang, {}).get("spaced", True):
        return [w + " " for w in text.split()]
    if lang == "th":
        global _THAI_TOKENIZER
        if _THAI_TOKENIZER is None:
            try:
                from pythainlp.tokenize import word_tokenize
                _THAI_TOKENIZER = lambda s: word_tokenize(s, keep_whitespace=False)
            except Exception:
                _THAI_TOKENIZER = False
        if _THAI_TOKENIZER:
            return list(_THAI_TOKENIZER(text))
    # Fallback: split into characters, but never separate a base char from its combining marks
    # or a prefix vowel from what follows.
    toks: list[str] = []
    glue_next = False
    for ch in text:
        if toks and (glue_next or unicodedata.category(ch).startswith("M")):
            toks[-1] += ch
        else:
            toks.append(ch)
        glue_next = ch in _LEADING_VOWELS
    return toks


def wrap_text(text: str, max_chars: int, lang: str, max_lines: int = 3) -> list[str]:
    """Break text into balanced lines of at most ~max_chars."""
    text = " ".join(text.split())
    if len(text) <= max_chars:
        return [text]
    n = min(max_lines, math.ceil(len(text) / max_chars))
    target = math.ceil(len(text) / n)
    lines, cur = [], ""
    for tok in _tokens(text, lang):
        if cur and len(cur.rstrip()) + len(tok.rstrip()) > target and len(lines) < n - 1:
            lines.append(cur.rstrip())
            cur = ""
        cur += tok
    if cur:
        lines.append(cur.rstrip())
    return lines


def _esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("{", "(").replace("}", ")")


def to_ass(items: list[tuple[float, float, str, str]], lang: str, width: int, height: int,
           bilingual: bool = False) -> str:
    """items: (start, end, translated_text, source_text)."""
    base = min(width, height)
    size = round(base * 0.055)
    small = round(size * 0.7)
    max_chars = max(10, int(width * 0.9 / (size * (0.45 if lang == "th" else 0.5))))
    font = LANGS.get(lang, {}).get("font", "Noto Sans")
    margin_v = round(height * 0.06)
    head = (
        "[Script Info]\nScriptType: v4.00+\nWrapStyle: 2\nScaledBorderAndShadow: yes\n"
        f"PlayResX: {width}\nPlayResY: {height}\n\n"
        "[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,"
        "Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,"
        "MarginR,MarginV,Encoding\n"
        f"Style: Default,{font},{size},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,"
        f"{max(2, size // 14)},1,2,{round(width * 0.05)},{round(width * 0.05)},{margin_v},1\n\n"
        "[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n"
    )
    rows = []
    for a, b, text, src in items:
        body = r"\N".join(_esc(l) for l in wrap_text(text, max_chars, lang))
        if bilingual and src:
            body += r"\N{\fs%d\c&HCCCCCC&}" % small + r"\N".join(_esc(l) for l in wrap_text(src, int(max_chars * 1.4), "en"))
        rows.append(f"Dialogue: 0,{_ass_ts(a)},{_ass_ts(b)},Default,,0,0,0,,{body}")
    return head + "\n".join(rows) + "\n"
