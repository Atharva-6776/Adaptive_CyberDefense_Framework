import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Adaptive Cyber Defense Framework"
    API_V1_STR: str = "/api/v1"
    
    # Database
    POSTGRES_SERVER: str = "db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "cyberdefense"
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/cyberdefense"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str, info) -> str:
        # If DATABASE_URL is set in environment, use it. Otherwise, build it.
        if v and isinstance(v, str) and v != "postgresql://postgres:postgres@db:5432/cyberdefense":
            return v
        
        # Build URL dynamically from components
        data = info.data
        server = data.get("POSTGRES_SERVER", "db")
        user = data.get("POSTGRES_USER", "postgres")
        password = data.get("POSTGRES_PASSWORD", "postgres")
        db = data.get("POSTGRES_DB", "cyberdefense")
        
        return f"postgresql://{user}:{password}@{server}:5432/{db}"

    # JWT Settings
    JWT_SECRET_KEY: str = "supersecretaccesskeyplaceholder_please_change_in_production"
    JWT_REFRESH_SECRET_KEY: str = "supersecretrefreshkeyplaceholder_please_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # Moving Target Defense (MTD) Settings
    MTD_ENABLED: bool = True
    MTD_ROTATION_INTERVAL_SECONDS: int = 60
    MTD_DECOY_PATHS: List[str] = [
        "/api/v1/admin/debug",
        "/api/v1/system/env",
        "/api/v1/auth/keys",
        "/api/v1/database/export",
        "/api/v1/config/credentials"
    ]
    MTD_SEED: str = "adaptive-defense-framework-seed"
    MTD_ROTATION_HISTORY_LIMIT: int = 10
    # AI / Video Surveillance Settings
    MODEL_PATH: str = "ai-engine/models/best.pt"
    UPLOAD_DIR: str = "uploads"

    # Threat Mitigation Settings
    THREAT_DETECTION_WINDOW_SECONDS: int = 10
    THREAT_HONEYPOT_THRESHOLD: int = 3
    THREAT_BLOCK_DURATION_SECONDS: int = 600

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
