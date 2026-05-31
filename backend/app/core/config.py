from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


from typing import Optional

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_env: str = "development"
    database_url: str = "sqlite:///./dev.sqlite"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    
    mailcow_base_url: Optional[str] = None
    mailcow_api_key: Optional[str] = None
    mailbox_quota_mb: int = 250

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
