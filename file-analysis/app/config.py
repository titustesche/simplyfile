from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Konfiguration ueber Umgebungsvariablen (Prefix FA_)."""

    model_config = SettingsConfigDict(env_prefix="FA_", env_file=".env", extra="ignore")

    # OCR
    ocr_model: str = "baidu/Unlimited-OCR"
    ocr_device: str = "cuda"  # "cuda" oder "cpu"
    ocr_prompt: str = "<image>\n<|grounding|>Convert the document to markdown."
    ocr_base_size: int = 1024
    ocr_image_size: int = 640
    ocr_crop_mode: bool = True
    ocr_max_length: int = 8192
    pdf_dpi: int = 200
    max_pages: int = 50

    # LLM-Analyse: "openai" (OpenAI-kompatibel, auch Ollama/vLLM/LM Studio) oder "anthropic"
    llm_provider: str = "openai"
    llm_base_url: str = "http://host.docker.internal:11434/v1"  # Default: Ollama
    llm_api_key: str = ""  # bei Ollama leer lassen
    llm_model: str = "qwen2.5:7b-instruct"
    llm_timeout: float = 300.0
    llm_max_chars: int = 24000  # laengere OCR-Texte werden fuer die Analyse gekuerzt

    max_upload_mb: int = 50


def get_settings() -> Settings:
    return Settings()
