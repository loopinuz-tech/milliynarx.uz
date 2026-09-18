import os
from typing import List
from pydantic_settings import BaseSettings

# Determine project root directory
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DEFAULT_SQLITE_PATH = os.path.join(PROJECT_ROOT, "milliy_narx.db").replace("\\", "/")
DEFAULT_UPLOAD_DIR = os.path.join(PROJECT_ROOT, "uploads")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Milliy Narx"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database configuration (PostgreSQL in production, SQLite fallback for instant local dev)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{DEFAULT_SQLITE_PATH}"
    )
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-milliy-narx-terminal-jwt-key-2026-prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # AI Analysis — OpenRouter (backend-only, NEVER exposed to frontend)
    # Primary: OpenRouter (supports many models incl. free tier)
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-v4-flash-0731:free")
    OPENROUTER_FALLBACK_MODELS: str = os.getenv("OPENROUTER_FALLBACK_MODELS", "deepseek/deepseek-chat:free,deepseek/deepseek-r1:free")
    # Fallback legacy: OpenAI direct (used only if OPENROUTER_API_KEY not set)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://milliynarx.uz",
        "http://milliynarx.uz",
        "https://milliynarx.vercel.app",
        "http://milliynarx.vercel.app",
        "https://milliy-narx.uz",
        "http://milliy-narx.uz"
    ]
    
    # Storage for Contabo VPS
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", DEFAULT_UPLOAD_DIR)
    MAX_UPLOAD_SIZE_MB: int = 10
    
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "8802850363:AAHLKqMDEMZ_QSmYXPuop_-gwT-W5NW1D80")
    TELEGRAM_BOT_USERNAME: str = os.getenv("TELEGRAM_BOT_USERNAME", "milliynarxbot")
    
    class Config:
        case_sensitive = True
        env_file = os.path.join(PROJECT_ROOT, ".env")

settings = Settings()
