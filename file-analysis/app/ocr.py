"""OCR mit baidu/Unlimited-OCR. Kapselt Laden des Modells und Datei -> Text."""
import logging
import tempfile
import threading
from dataclasses import dataclass
from pathlib import Path

import fitz  # pymupdf

from .config import Settings

log = logging.getLogger(__name__)

IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp", "image/bmp", "image/tiff"}
TEXT_TYPES = {"text/plain", "text/markdown", "text/csv"}


@dataclass
class OcrOutput:
    text: str
    pages: int


class UnsupportedFileType(ValueError):
    pass


class OcrEngine:
    def __init__(self, settings: Settings):
        self.s = settings
        self._model = None
        self._tokenizer = None
        self._lock = threading.Lock()  # Modell ist nicht thread-safe

    def _load(self):
        if self._model is not None:
            return
        # Lazy-Import: Tests und Textdateien brauchen torch nicht
        import torch
        from transformers import AutoModel, AutoTokenizer

        log.info("Lade OCR-Modell %s", self.s.ocr_model)
        tok = AutoTokenizer.from_pretrained(self.s.ocr_model, trust_remote_code=True)
        model = AutoModel.from_pretrained(self.s.ocr_model, trust_remote_code=True, use_safetensors=True)
        if self.s.ocr_device == "cuda":
            model = model.eval().cuda().to(torch.bfloat16)
        else:
            model = model.eval()
        self._tokenizer, self._model = tok, model

    def _ocr_image(self, image_path: Path) -> str:
        self._load()
        with tempfile.TemporaryDirectory() as out:
            # Signatur analog zur Model Card (infer mit prompt/image_file/output_path/...)
            res = self._model.infer(
                self._tokenizer,
                prompt=self.s.ocr_prompt,
                image_file=str(image_path),
                output_path=out,
                base_size=self.s.ocr_base_size,
                image_size=self.s.ocr_image_size,
                crop_mode=self.s.ocr_crop_mode,
                max_length=self.s.ocr_max_length,
                save_results=True,
            )
            if isinstance(res, str) and res.strip():
                return res.strip()
            # Fallback: Ergebnis wurde in den Output-Ordner geschrieben
            for name in ("result.mmd", "result.md", "result.txt"):
                f = Path(out) / name
                if f.exists():
                    return f.read_text(encoding="utf-8").strip()
        return ""

    def extract(self, path: Path, mime_type: str) -> OcrOutput:
        if mime_type in TEXT_TYPES:
            return OcrOutput(path.read_text(encoding="utf-8", errors="replace"), 1)

        if mime_type == "application/pdf":
            with fitz.open(path) as doc:
                n = min(len(doc), self.s.max_pages)
                parts = []
                with tempfile.TemporaryDirectory() as tmp, self._lock:
                    for i in range(n):
                        img = Path(tmp) / f"page_{i + 1}.png"
                        doc[i].get_pixmap(dpi=self.s.pdf_dpi).save(img)
                        parts.append(self._ocr_image(img))
                return OcrOutput("\n\n".join(parts), len(doc))

        if mime_type in IMAGE_TYPES:
            with self._lock:
                return OcrOutput(self._ocr_image(path), 1)

        raise UnsupportedFileType(f"Dateityp nicht unterstuetzt: {mime_type}")
