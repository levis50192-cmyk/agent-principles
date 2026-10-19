import os
import re
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from . import config, jobs
from .langs import LANGS

app = FastAPI(title="VideoTrans")
STATIC = Path(__file__).parent / "static"
ALLOWED_EXT = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v", ".flv"}


def _get(job_id: str) -> dict:
    try:
        return jobs.load(job_id)
    except KeyError:
        raise HTTPException(404, "找不到此任務")


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


@app.get("/api/meta")
def meta():
    return {"langs": {k: {"label": v["label"], "voices": v["voices"]} for k, v in LANGS.items()},
            "claude_key": bool(os.environ.get("ANTHROPIC_API_KEY")), "whisper_model": config.WHISPER_MODEL,
            "claude_model": config.CLAUDE_MODEL}


@app.get("/api/jobs")
def list_jobs():
    return jobs.list_jobs()


@app.post("/api/jobs")
async def create_job(file: UploadFile = File(...), targets: str = Form(...), source_lang: str = Form(""),
                     context: str = Form(""), dub: bool = Form(True), burn: bool = Form(True),
                     bilingual: bool = Form(False), auto_render: bool = Form(False),
                     original_volume: float = Form(0.12)):
    langs = [t for t in targets.split(",") if t]
    if not langs or any(t not in LANGS for t in langs):
        raise HTTPException(400, "請選擇有效的目標語言")
    if source_lang and source_lang not in LANGS:
        raise HTTPException(400, "不支援的來源語言")
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"不支援的格式 {ext or '(無副檔名)'}")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise HTTPException(400, "伺服器未設定 ANTHROPIC_API_KEY")
    job = jobs.create(file.filename, {
        "targets": langs, "source_lang": source_lang, "context": context.strip(), "dub": dub, "burn": burn,
        "bilingual": bilingual, "auto_render": auto_render, "original_volume": max(0.0, min(original_volume, 1.0))})
    dest = jobs.job_dir(job["id"]) / f"source{ext}"
    size = 0
    with dest.open("wb") as f:
        while chunk := await file.read(1 << 20):
            size += len(chunk)
            if size > config.MAX_UPLOAD_BYTES:
                f.close()
                jobs.delete(job["id"])
                raise HTTPException(413, "檔案太大")
            f.write(chunk)
    jobs.update(job["id"], status="queued", message="排隊中")
    jobs.submit(jobs.analyze, job["id"])
    return {"id": job["id"]}


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str):
    return _get(job_id)


class SegmentEdit(BaseModel):
    id: int
    start: float
    end: float
    text: str
    tr: dict[str, str]


@app.put("/api/jobs/{job_id}/segments")
def put_segments(job_id: str, segments: list[SegmentEdit]):
    job = _get(job_id)
    for s in segments:
        if s.end <= s.start:
            raise HTTPException(400, f"第 {s.id + 1} 句結束時間必須大於開始時間")
    ordered = sorted((s.model_dump() for s in segments), key=lambda s: s["start"])
    jobs.update(job["id"], segments=ordered)
    return {"ok": True}


class RenderReq(BaseModel):
    langs: list[str]
    dub: bool = True
    burn: bool = True
    bilingual: bool = False
    voices: dict[str, str] = {}
    original_volume: float = 0.12


@app.post("/api/jobs/{job_id}/render")
def render(job_id: str, req: RenderReq):
    job = _get(job_id)
    if job["status"] not in ("review", "done", "error") or not job["segments"]:
        raise HTTPException(409, "任務尚未完成翻譯")
    if any(l not in job["targets"] for l in req.langs):
        raise HTTPException(400, "語言不在此任務的目標內")
    for l, v in req.voices.items():
        if l not in LANGS or v not in LANGS[l]["voices"]:
            raise HTTPException(400, "不支援的配音聲線")
    opts = {**job["options"], "dub": req.dub, "burn": req.burn, "bilingual": req.bilingual,
            "voices": req.voices, "original_volume": max(0.0, min(req.original_volume, 1.0))}
    jobs.update(job_id, options=opts, status="queued", message="排隊輸出中")
    jobs.submit(jobs.render, job_id, req.langs)
    return {"ok": True}


@app.get("/api/jobs/{job_id}/files/{name}")
def get_file(job_id: str, name: str, download: bool = False):
    _get(job_id)
    if not re.fullmatch(r"(source\.\w+|output\.[\w-]+\.mp4|subs\.[\w-]+\.(srt|vtt))", name):
        raise HTTPException(404)
    p = jobs.job_dir(job_id) / name
    if not p.exists():
        raise HTTPException(404)
    return FileResponse(p, filename=name if download else None)


@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: str):
    _get(job_id)
    jobs.delete(job_id)
    return {"ok": True}
