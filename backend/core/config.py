"""Application settings loaded from environment variables."""

from __future__ import annotations

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # API Keys
    GEMINI_API_KEY: str = ""
    OPENAQ_API_KEY: str = ""
    FIREBASE_CREDENTIALS_JSON: str = ""  # path to service-account JSON

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # Misc
    DEBUG: bool = False
    CACHE_TTL_SECONDS: int = 600  # 10-minute AQI cache
    OPENAQ_BASE_URL: str = "https://api.openaq.org/v3"
    LOG_LEVEL: str = "INFO"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()
