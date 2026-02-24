from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str = "sqlite:///./mady.db"
    CORS_ORIGINS: list[str] = ["*"]
    APP_NAME: str = "Mady Restaurant API"
    DEBUG: bool = True


settings = Settings()
