import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory of the 'api' folder
API_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Ensure SQLite path is relative to the 'api' folder for Vercel
    DATABASE_URL: str = f"sqlite:///{os.path.join(API_DIR, 'mady.db')}"

    def get_db_url(self) -> str:
        # SQLAlchemy requires 'postgresql://', but Supabase/Heroku often give 'postgres://'
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url
    CORS_ORIGINS: list[str] = ["*"]
    APP_NAME: str = "Mady Restaurant API"
    DEBUG: bool = True


settings = Settings()
