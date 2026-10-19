import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("VT_DATA_DIR", ROOT / "data")).resolve()
JOBS_DIR = DATA_DIR / "jobs"
FONTS_DIR = ROOT / "fonts"

CLAUDE_MODEL = os.environ.get("VT_CLAUDE_MODEL", "claude-sonnet-5-5")
WHISPER_MODEL = os.environ.get("VT_WHISPER_MODEL", "small")
WHISPER_DEVICE = os.environ.get("VT_WHISPER_DEVICE", "auto")
MAX_UPLOAD_BYTES = int(os.environ.get("VT_MAX_UPLOAD_MB", "2048")) * 1024 * 1024

JOBS_DIR.mkdir(parents=True, exist_ok=True)
