import os
from typing import List
from dotenv import load_dotenv

# Load .env from project root (works whether running from backend/ or root)
_here = os.path.dirname(__file__)
load_dotenv(os.path.join(_here, '..', '.env'), override=True)
load_dotenv(os.path.join(_here, '.env'), override=False)

class Settings:
    # Database
    DB_URL: str = os.getenv(
        "DB_URL",
        ""  # Must be set in .env — never hard-code credentials here
    )

    # JWT Authentication
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET",
        ""  # Must be set in .env — never hard-code credentials here
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://localhost:8080,http://localhost:8081,http://127.0.0.1:5173,http://localhost:3000,*"
        ).split(",")
        if origin.strip()
    ]

    # Cloudinary & External Services
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")

    # Multi-Tenant Isolation (Model B)
    # Set to "false" to disable tenant filtering for single-institution (Model A) deployments
    MULTI_TENANT_ENABLED: bool = os.getenv("MULTI_TENANT_ENABLED", "true").lower() == "true"
    DEFAULT_TENANT_ID: str = os.getenv("DEFAULT_TENANT_ID", "INST-001")

settings = Settings()
