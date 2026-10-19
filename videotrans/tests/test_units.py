import json

import pytest

from app import asr, subs, translate
from app.dub import plan_fit


def test_srt_vtt_format():
    items = [(0.0, 1.5, "xin chào"), (3661.25, 3662, "tạm biệt")]
    assert subs.to_srt(items).startswith("1\n00:00:00,000 --> 00:00:01,500\nxin chào\n\n2\n01:01:01,250")
    assert "00:00:01.500" in subs.to_vtt(items)


def test_wrap_spaced_is_balanced():
    lines = subs.wrap_text("one two three four five six seven eight", 20, "vi")
    assert len(lines) == 2 and all(len(l) <= 22 for l in lines)
    assert " ".join(lines) == "one two three four five six seven eight"


def test_wrap_thai_fallback_never_splits_clusters(monkeypatch):
    monkeypatch.setattr(subs, "_THAI_TOKENIZER", False)
    text = "สวัสดีครับวันนี้เราจะมาทำอาหารไทยกันนะครับเชิญรับชมได้เลย"
    lines = subs.wrap_text(text, 20, "th")
    assert len(lines) >= 2 and "".join(lines) == text
    for l in lines:  # a line may not start with a combining mark or end with a prefix vowel
        assert not subs.unicodedata.category(l[0]).startswith("M")
        assert l[-1] not in subs._LEADING_VOWELS


def test_ass_contains_style_and_breaks():
    ass = subs.to_ass([(0, 2, "chào " * 30, "hello")], "vi", 1280, 720, bilingual=True)
    assert "PlayResX: 1280" in ass and "Noto Sans" in ass and r"\N" in ass and "Dialogue:" in ass


def test_parse_json_array():
    assert translate.parse_json_array('Sure: ["a", "b"]') == ["a", "b"]
    with pytest.raises(ValueError):
        translate.parse_json_array("nope")


class FakeClient:
    """Miscounts on the first call to exercise the retry path, then echoes upper-case."""
    def __init__(self):
        self.calls = 0
        self.messages = self

    def create(self, **kw):
        self.calls += 1
        lines = json.loads(kw["messages"][0]["content"])["lines"]
        out = lines[:-1] if self.calls == 1 else [l.upper() for l in lines]
        block = type("B", (), {"type": "text", "text": json.dumps(out)})()
        return type("M", (), {"content": [block]})()


def test_translate_retries_on_miscount_and_keeps_length():
    c = FakeClient()
    assert translate.translate_lines(["a", "b", "c"], "en", "vi", client=c) == ["A", "B", "C"]
    assert c.calls == 2


def test_translate_same_language_skips_api():
    assert translate.translate_lines(["x"], "vi", "vi", client=None) == ["x"]


def test_regroup_splits_on_pause_and_sentence_end():
    w = lambda s, e, t: {"start": s, "end": e, "word": t}
    words = [w(0, .4, " Hello"), w(.4, .8, " there."), w(.9, 1.2, " Next"), w(3.0, 3.3, " after"), w(3.3, 3.6, " pause")]
    assert [s["text"] for s in asr.regroup(words)] == ["Hello there.", "Next", "after pause"]


def test_plan_fit():
    assert plan_fit(1.0, 0, 2.0, 5.0) == (1.0, None)                 # fits
    assert plan_fit(2.5, 0, 2.0, 5.0) == (1.0, None)                 # may overflow into the gap
    sp, trim = plan_fit(4.0, 0, 2.0, 2.5)                            # no room: speed up to the cap
    assert sp == 1.5 and trim is not None and trim < 2.5
