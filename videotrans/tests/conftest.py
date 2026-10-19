import os, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("VT_DATA_DIR", "/tmp/vt-test-data")
