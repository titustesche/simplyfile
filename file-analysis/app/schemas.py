from typing import Literal

from pydantic import BaseModel, Field


class Entity(BaseModel):
    type: Literal["person", "organization", "date", "amount", "identifier", "location", "other"]
    value: str


class Analysis(BaseModel):
    """Vom LLM erzeugter Teil des Ergebnisses."""

    summary: str
    tags: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    document_type: str = "other"
    language: str = "unknown"
    entities: list[Entity] = Field(default_factory=list)


class FileInfo(BaseModel):
    filename: str
    mime_type: str
    pages: int


class AnalysisResult(Analysis):
    file: FileInfo
    text: str = Field(description="Kompletter OCR-Text (Markdown)")
