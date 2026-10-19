import json
import subprocess
from pathlib import Path


class MediaError(RuntimeError):
    pass


def run(cmd: list[str], cwd: Path | None = None) -> str:
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if p.returncode != 0:
        raise MediaError(f"{cmd[0]} failed: {p.stderr.strip()[-800:]}")
    return p.stdout


def probe(path: Path) -> dict:
    out = run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)])
    info = json.loads(out)
    video = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    if video is None:
        raise MediaError("檔案內沒有影像串流")
    rotation = 0
    for sd in video.get("side_data_list", []) or []:
        if "rotation" in sd:
            rotation = abs(int(sd["rotation"])) % 360
    w, h = int(video["width"]), int(video["height"])
    if rotation in (90, 270):
        w, h = h, w
    return {
        "duration": float(info["format"].get("duration") or video.get("duration") or 0),
        "width": w,
        "height": h,
        "has_audio": any(s["codec_type"] == "audio" for s in info["streams"]),
    }


def extract_audio(video: Path, wav: Path) -> None:
    run(["ffmpeg", "-y", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", str(wav)])
