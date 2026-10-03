import mimetypes
from pathlib import Path

from .llm import LlmClient
from .ocr import OcrEngine
from .schemas import AnalysisResult, FileInfo


class AnalysisService:
    def __init__(self, ocr: OcrEngine, llm: LlmClient):
        self.ocr, self.llm = ocr, llm

    def analyze_file(self, path: Path, filename: str | None = None, mime_type: str | None = None) -> AnalysisResult:
        filename = filename or path.name
        mime_type = mime_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"
        out = self.ocr.extract(path, mime_type)
        analysis = self.llm.analyze(out.text)
        return AnalysisResult(
            **analysis.model_dump(),
            file=FileInfo(filename=filename, mime_type=mime_type, pages=out.pages),
            text=out.text,
        )
