"""CLI: python cli.py <datei>  ->  JSON auf stdout."""
import sys
from pathlib import Path

from app.config import get_settings
from app.llm import LlmClient
from app.ocr import OcrEngine
from app.service import AnalysisService


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python cli.py <datei>", file=sys.stderr)
        return 2
    s = get_settings()
    result = AnalysisService(OcrEngine(s), LlmClient(s)).analyze_file(Path(sys.argv[1]))
    print(result.model_dump_json(indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
