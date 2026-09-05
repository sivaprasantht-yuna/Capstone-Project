import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    APP_NAME: str = "Zero-Storage Idea Distillation & Vector Deduplication Engine"
    VERSION: str = "1.0.0"
    
    # Supabase Database Configuration
    DB_URL: str = os.getenv(
        "DB_URL",
        "postgresql://postgres.iqkserylncujlyjtopsl:sivaprasanth@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
    )
    DB_USERNAME: str = os.getenv("DB_USERNAME", "postgres.iqkserylncujlyjtopsl")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "sivaprasanth")
    
    # Robust PostgreSQL connection DSN
    @property
    def clean_db_url(self) -> str:
        url = self.DB_URL
        if url.startswith("jdbc:"):
            url = url[5:]
        # If url doesn't have credentials embedded, construct with username/password
        if "@" not in url and self.DB_USERNAME and self.DB_PASSWORD:
            # url is like postgresql://host:port/dbname?params
            if "://" in url:
                prefix, rest = url.split("://", 1)
                url = f"{prefix}://{self.DB_USERNAME}:{self.DB_PASSWORD}@{rest}"
        return url

    # LLM API Keys
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # FastEmbed & Deduplication Settings
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIMENSION: int = 384
    SIMILARITY_THRESHOLD: float = 0.85
    
    # CORS
    ALLOWED_ORIGINS: list[str] = ["*"]

settings = Settings()
