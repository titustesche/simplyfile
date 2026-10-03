import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app import main
from app.config import Settings
from app.llm import LlmClient, LlmError, parse_json
from app.ocr import OcrEngine
from app.service import AnalysisService

ANALYSIS = {
    "summary": "Rechnung ueber 100 EUR.",
    "tags": ["rechnung"],
    "keywords": ["rechnung", "acme"],
    "document_type": "invoice",
    "language": "de",
    "entities": [{"type": "amount", "value": "100 EUR"}],
}


def llm_with(handler, **kw):
    s = Settings(llm_base_url="http://llm/v1", llm_model="m", **kw)
    return LlmClient(s, httpx.Client(transport=httpx.MockTransport(handler)))


def openai_handler(request):
    assert request.url.path == "/v1/chat/completions"
    return httpx.Response(200, json={"choices": [{"message": {"content": "```json\n" + json.dumps(ANALYSIS) + "\n```"}}]})


def test_parse_json_variants():
    assert parse_json('Hier: {"a": 1} fertig') == {"a": 1}
    with pytest.raises(LlmError):
        parse_json("kein json")


def test_openai_provider():
    assert llm_with(openai_handler).analyze("text").tags == ["rechnung"]


def test_anthropic_provider():
    def h(request):
        assert request.url.path == "/v1/messages"
        assert request.headers["x-api-key"] == "k"
        return httpx.Response(200, json={"content": [{"type": "text", "text": json.dumps(ANALYSIS)}]})

    c = llm_with(h, llm_provider="anthropic", llm_api_key="k")
    c.s.llm_base_url = "http://llm"
    assert c.analyze("text").document_type == "invoice"


def test_endpoint_with_text_file(monkeypatch):
    s = Settings()
    monkeypatch.setattr(main, "get_service", lambda: AnalysisService(OcrEngine(s), llm_with(openai_handler)))
    r = TestClient(main.app).post("/analyze", files={"file": ("a.txt", b"Rechnung 100 EUR", "text/plain")})
    assert r.status_code == 200
    body = r.json()
    assert body["text"] == "Rechnung 100 EUR"
    assert body["file"] == {"filename": "a.txt", "mime_type": "text/plain", "pages": 1}
    assert body["keywords"] and body["summary"]


def test_unsupported_type(monkeypatch):
    s = Settings()
    monkeypatch.setattr(main, "get_service", lambda: AnalysisService(OcrEngine(s), llm_with(openai_handler)))
    r = TestClient(main.app).post("/analyze", files={"file": ("a.zip", b"x", "application/zip")})
    assert r.status_code == 415
