"""LLM-Anbindung: OpenAI-kompatibel (OpenAI, Ollama, vLLM, ...) oder Anthropic."""
import json
import re

import httpx

from .config import Settings
from .schemas import Analysis

SYSTEM_PROMPT = """Du analysierst Dokumente fuer eine Dateiverwaltung. Du bekommst den OCR-Text eines Dokuments.
Antworte AUSSCHLIESSLICH mit einem JSON-Objekt, ohne Erklaerung und ohne Markdown-Codeblock, mit diesen Feldern:
{
  "summary": "Zusammenfassung in 2-4 Saetzen, in der Sprache des Dokuments",
  "tags": ["3-8 kurze, thematische Kategorien, kleingeschrieben"],
  "keywords": ["8-20 Suchbegriffe, die jemand zum Wiederfinden des Dokuments eingeben wuerde"],
  "document_type": "z.B. invoice, contract, letter, report, receipt, form, other",
  "language": "ISO-639-1 Code, z.B. de oder en",
  "entities": [{"type": "person|organization|date|amount|identifier|location|other", "value": "..."}]
}
Erfinde nichts, was nicht im Text steht. Ist der Text leer oder unlesbar, gib eine kurze entsprechende summary und leere Listen zurueck."""


class LlmError(RuntimeError):
    pass


def parse_json(raw: str) -> dict:
    """Extrahiert das JSON-Objekt, auch wenn das Modell Text/Codebloecke drumherum liefert."""
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start, end = raw.find("{"), raw.rfind("}")
        if start == -1 or end <= start:
            raise LlmError("LLM-Antwort enthaelt kein JSON")
        try:
            return json.loads(raw[start : end + 1])
        except json.JSONDecodeError as e:
            raise LlmError(f"LLM-Antwort ist kein gueltiges JSON: {e}") from e


class LlmClient:
    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        self.s = settings
        self.http = http or httpx.Client(timeout=settings.llm_timeout)

    def _complete(self, user_text: str) -> str:
        if self.s.llm_provider == "anthropic":
            r = self.http.post(
                (self.s.llm_base_url or "https://api.anthropic.com") + "/v1/messages",
                headers={"x-api-key": self.s.llm_api_key, "anthropic-version": "2023-06-01"},
                json={
                    "model": self.s.llm_model,
                    "max_tokens": 2048,
                    "system": SYSTEM_PROMPT,
                    "messages": [{"role": "user", "content": user_text}],
                },
            )
            r.raise_for_status()
            return "".join(b.get("text", "") for b in r.json()["content"])

        if self.s.llm_provider == "openai":
            headers = {"Authorization": f"Bearer {self.s.llm_api_key}"} if self.s.llm_api_key else {}
            r = self.http.post(
                self.s.llm_base_url.rstrip("/") + "/chat/completions",
                headers=headers,
                json={
                    "model": self.s.llm_model,
                    "temperature": 0.2,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_text},
                    ],
                },
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]

        raise LlmError(f"Unbekannter FA_LLM_PROVIDER: {self.s.llm_provider}")

    def analyze(self, text: str) -> Analysis:
        text = text[: self.s.llm_max_chars]
        try:
            raw = self._complete(f"Dokumenttext:\n\n{text}")
        except httpx.HTTPError as e:
            raise LlmError(f"LLM-Aufruf fehlgeschlagen: {e}") from e
        return Analysis.model_validate(parse_json(raw))
