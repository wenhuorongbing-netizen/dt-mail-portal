from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DT Mail Portal"
    app_env: str = "local"
    app_base_url: str = "http://localhost:5173"
    api_cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    database_url: str = Field(default="sqlite:///./dev.db")
    mail_domain: str = "mail.buffjo.top"
    customer_portal_domain: str = "tickets.buffjo.top"
    webmail_domain: str = "webmail.buffjo.top"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.api_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
