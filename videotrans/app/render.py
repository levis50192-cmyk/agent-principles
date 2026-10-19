"""Final render: subtitle files, optional burned-in subtitles, optional dubbed audio."""
import shutil
from pathlib import Path

from . import config, subs
from .dub import build_dub_track
from .media import run


def _filter_path(p: Path) -> str:
    return str(p).replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")


def render_language(job_dir: Path, job: dict, lang: str, *, dub: bool, burn: bool, bilingual: bool,
                    voice: str, original_volume: float) -> dict:
    segs = [s for s in job["segments"] if s["tr"].get(lang, "").strip()]
    items = [(s["start"], s["end"], s["tr"][lang]) for s in segs]
    files = {}

    (job_dir / f"subs.{lang}.srt").write_text(subs.to_srt(items), encoding="utf-8")
    (job_dir / f"subs.{lang}.vtt").write_text(subs.to_vtt(items), encoding="utf-8")
    files["srt"], files["vtt"] = f"subs.{lang}.srt", f"subs.{lang}.vtt"
    if not (dub or burn):
        return files

    src = next(job_dir.glob("source.*"))
    cmd = ["ffmpeg", "-y", "-i", src.name]
    if burn:
        ass = f"subs.{lang}.ass"
        (job_dir / ass).write_text(
            subs.to_ass([(s["start"], s["end"], s["tr"][lang], s["text"]) for s in segs], lang,
                        job["width"], job["height"], bilingual), encoding="utf-8")
        vf = f"ass={ass}"
        if config.FONTS_DIR.is_dir():
            vf += f":fontsdir='{_filter_path(config.FONTS_DIR)}'"
        cmd += ["-vf", vf, "-c:v", "libx264", "-crf", "20", "-preset", "veryfast", "-pix_fmt", "yuv420p"]
    else:
        cmd += ["-c:v", "copy"]

    if dub:
        track = build_dub_track(job["segments"], lang, voice, job["duration"], job_dir / "tts")
        cmd[4:4] = ["-i", str(track)]
        if job["has_audio"] and original_volume > 0:
            cmd += ["-filter_complex",
                    f"[0:a]volume={original_volume}[o];[o][1:a]amix=inputs=2:duration=first:normalize=0[a]",
                    "-map", "0:v", "-map", "[a]"]
        else:
            cmd += ["-map", "0:v", "-map", "1:a"]
        cmd += ["-c:a", "aac", "-b:a", "160k", "-shortest"]
    else:
        cmd += ["-map", "0:v", "-map", "0:a?", "-c:a", "copy"]

    out = f"output.{lang}.mp4"
    run(cmd + ["-movflags", "+faststart", out], cwd=job_dir)
    files["video"] = out
    if dub:
        shutil.rmtree(job_dir / "tts", ignore_errors=True)
    return files
