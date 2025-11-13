"""
Configuration and environment variable management for the FastAPI application.

This module loads and validates environment variables using python-dotenv,
providing centralized configuration management for the entire application.
"""

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Attributes:
        DATABASE_URL: PostgreSQL connection string
        JWT_SECRET: Secret key for JWT token generation
        JWT_ALGORITHM: Algorithm used for JWT encoding/decoding
        JWT_EXPIRATION: JWT token expiration time in minutes
        CORS_ORIGINS: List of allowed CORS origins
    """
    
    # Database Configuration
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/testify_db"
    
    # JWT Configuration
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 30  # minutes
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
    ]
    
    # Application Configuration
    APP_TITLE: str = "Online Exam Management System"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    
    class Config:
        """Pydantic configuration for BaseSettings."""
        env_file = ".env"
        case_sensitive = True


# Create a global settings instance
settings = Settings()
