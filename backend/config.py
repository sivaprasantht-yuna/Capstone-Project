import os
from typing import List

class Settings:
    # Database
    DB_URL: str = os.getenv(
        "DB_URL",
        "postgresql://postgres.iqkserylncujlyjtopsl:sivaprasanth@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
    )

    # JWT Authentication
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET",
        "CapstoneHubSuperSecretKeyForJWTTokenGeneration2024!!!"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

    # Cloudinary & External Services
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "wc8fbkbj")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "182754421256833")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "8-cAlhZkQnGYOmAxieNkZO0sBFg")

settings = Settings()
