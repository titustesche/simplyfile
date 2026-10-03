import logging
import mimetypes
import tempfile
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile

from .config import get_settings
from .llm import LlmClient, LlmError
from .ocr import OcrEngine, UnsupportedFileType
from .schemas import AnalysisResult
from .service import AnalysisService

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="simplyfile file-analysis")


@lru_cache
def get_service() -> AnalysisService:
    s = get_settings()
    return AnalysisService(OcrEngine(s), LlmClient(s))


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalysisResult)
def analyze(file: UploadFile = File(...)):
    """Datei hochladen (multipart, Feld `file`) -> strukturiertes JSON."""
    s = get_settings()
    filename = file.filename or "upload"
    mime = file.content_type
    if not mime or mime == "application/octet-stream":
        mime = mimetypes.guess_type(filename)[0] or "application/octet-stream"

    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / Path(filename).name
        size = 0
        with path.open("wb") as f:
            while chunk := file.file.read(1024 * 1024):
                size += len(chunk)
                if size > s.max_upload_mb * 1024 * 1024:
                    raise HTTPException(413, f"Datei groesser als {s.max_upload_mb} MB")
                f.write(chunk)
        try:
            return get_service().analyze_file(path, filename, mime)
        except UnsupportedFileType as e:
            raise HTTPException(415, str(e))
        except LlmError as e:
            raise HTTPException(502, str(e))
