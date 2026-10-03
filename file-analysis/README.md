# file-analysis

Datei rein -> strukturiertes JSON raus. OCR mit [baidu/Unlimited-OCR](https://huggingface.co/baidu/Unlimited-OCR),
Analyse (Zusammenfassung, Tags, Suchbegriffe, ...) ueber ein konfigurierbares LLM
(Ollama / OpenAI-kompatibel / Anthropic).

## Aufruf aus Spring (im Docker-Netz)

```
POST http://file-analysis:8000/analyze     (multipart/form-data, Feld "file")
GET  http://file-analysis:8000/health
```

Unterstuetzt: PDF, PNG/JPEG/WebP/BMP/TIFF (OCR), txt/md/csv (ohne OCR).

## Ausgabe

```json
{
  "summary": "...", "tags": ["..."], "keywords": ["..."],
  "document_type": "invoice", "language": "de",
  "entities": [{"type": "amount", "value": "100 EUR"}],
  "file": {"filename": "a.pdf", "mime_type": "application/pdf", "pages": 2},
  "text": "<kompletter OCR-Text als Markdown>"
}
```

## Konfiguration

Env-Variablen mit Prefix `FA_`, siehe `.env.example` und `app/config.py`.

## Lokal

```
pip install -r requirements.txt -r requirements-ocr.txt
python cli.py beispiel.pdf
uvicorn app.main:app --port 8000
pip install -r requirements-dev.txt && pytest
```
