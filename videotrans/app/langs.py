"""Supported languages: translation prompt names, TTS voices, subtitle fonts."""

# spaced=False -> the script is written without spaces between words, so
# subtitle line breaks need a tokenizer (or grapheme-safe character splitting).
LANGS = {
    "vi": {"label": "越南語 Tiếng Việt", "name": "Vietnamese", "font": "Noto Sans", "spaced": True,
           "voices": ["vi-VN-HoaiMyNeural", "vi-VN-NamMinhNeural"],
           "hint": "Use correct diacritics. Natural spoken Vietnamese; pick pronouns (anh/chị/bạn/tôi) that fit the context."},
    "th": {"label": "泰語 ไทย", "name": "Thai", "font": "Noto Sans Thai", "spaced": False,
           "voices": ["th-TH-PremwadeeNeural", "th-TH-NiwatNeural"],
           "hint": "Natural spoken Thai with neutral polite particles; do not insert spaces between every word, only between phrases."},
    "id": {"label": "印尼語 Bahasa Indonesia", "name": "Indonesian", "font": "Noto Sans", "spaced": True,
           "voices": ["id-ID-GadisNeural", "id-ID-ArdiNeural"],
           "hint": "Natural conversational Indonesian (not overly formal)."},
    "ms": {"label": "馬來語 Bahasa Melayu", "name": "Malay", "font": "Noto Sans", "spaced": True,
           "voices": ["ms-MY-YasminNeural", "ms-MY-OsmanNeural"],
           "hint": "Natural Malaysian Malay."},
    "fil": {"label": "菲律賓語 Filipino", "name": "Filipino (Tagalog)", "font": "Noto Sans", "spaced": True,
            "voices": ["fil-PH-BlessicaNeural", "fil-PH-AngeloNeural"],
            "hint": "Natural conversational Filipino; light Taglish is fine where Filipinos would say it."},
    "km": {"label": "高棉語 ភាសាខ្មែរ", "name": "Khmer", "font": "Noto Sans Khmer", "spaced": False,
           "voices": ["km-KH-SreymomNeural", "km-KH-PisethNeural"], "hint": "Natural spoken Khmer."},
    "my": {"label": "緬甸語 မြန်မာ", "name": "Burmese", "font": "Noto Sans Myanmar", "spaced": False,
           "voices": ["my-MM-NilarNeural", "my-MM-ThihaNeural"], "hint": "Natural spoken Burmese, Unicode (not Zawgyi)."},
    "lo": {"label": "寮語 ລາວ", "name": "Lao", "font": "Noto Sans Lao", "spaced": False,
           "voices": ["lo-LA-KeomanyNeural", "lo-LA-ChanthavongNeural"], "hint": "Natural spoken Lao."},
    "zh-TW": {"label": "繁體中文", "name": "Traditional Chinese (Taiwan)", "font": "Noto Sans CJK TC", "spaced": False,
              "voices": ["zh-TW-HsiaoChenNeural", "zh-TW-YunJheNeural"], "hint": "Taiwanese Mandarin vocabulary."},
    "zh": {"label": "簡體中文", "name": "Simplified Chinese", "font": "Noto Sans CJK SC", "spaced": False,
           "voices": ["zh-CN-XiaoxiaoNeural", "zh-CN-YunxiNeural"], "hint": ""},
    "en": {"label": "English", "name": "English", "font": "Noto Sans", "spaced": True,
           "voices": ["en-US-JennyNeural", "en-US-GuyNeural"], "hint": ""},
    "ja": {"label": "日本語", "name": "Japanese", "font": "Noto Sans CJK JP", "spaced": False,
           "voices": ["ja-JP-NanamiNeural", "ja-JP-KeitaNeural"], "hint": ""},
    "ko": {"label": "한국어", "name": "Korean", "font": "Noto Sans CJK KR", "spaced": True,
           "voices": ["ko-KR-SunHiNeural", "ko-KR-InJoonNeural"], "hint": ""},
}

# Whisper language codes that differ from ours.
WHISPER_CODE = {"zh-TW": "zh", "fil": "tl"}
FROM_WHISPER = {"tl": "fil"}


def name_of(code: str) -> str:
    return LANGS.get(code, {}).get("name", code)
