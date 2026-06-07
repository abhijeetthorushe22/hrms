from pydantic_settings import BaseSettings
from typing import List, Optional
import os
import secrets
from functools import lru_cache

class Settings(BaseSettings):
    PYTHON_VERSION: Optional[str] = None  # For documentation purposes
    PROJECT_NAME: str = "AuraHR"
    VERSION: str = "1.0.0" 
    DESCRIPTION: str = "AI-Powered Human Resource Management System"
    API_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
        
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    DATABASE_NAME: str = "aurahr"
    
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/msmarco-distilbert-base-v4"
    SPACY_MODEL_NAME: str = "en_core_web_sm"
    
    CHROMADB_HOST: str = "localhost"
    CHROMADB_PORT: int = 8000
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"
    
    SECRET_KEY: str = secrets.token_urlsafe(32) 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
        
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_MODEL_NAME: str = "gemini-2.0-flash"
    FRONTEND_URL: Optional[str] = None
        
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_FILE_TYPES: List[str] = [".pdf", ".docx", ".txt"]
    
    REDIS_URL: str = "redis://localhost:6379"
    ENABLE_REDIS_CACHE: bool = False
        
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost:8080"
    ]
    
    LOG_LEVEL: str = "INFO"
    
    ENABLE_SPACY_PROCESSING: bool = True
    ENABLE_GEMINI_FALLBACK: bool = False
    ENABLE_ADVANCED_PDF: bool = True
    ENABLE_ML_CLASSIFIER: bool = True
    ENABLE_ENTITY_EXTRACTION: bool = True
    
    #  Initialize AI services on startup
    INIT_AI_ON_STARTUP: bool = True 
    
    DEBUG: bool = False
    RELOAD: bool = True
    ENABLE_DOCS: bool = True
    DOCS_URL: str = "/docs"
    REDOC_URL: str = "/redoc"
    
    def validate_config(self) -> bool:
        """Validate critical configuration settings"""
        if self.ENVIRONMENT == "production":
            # Production validation
            if "localhost" in self.DATABASE_URL:
                raise ValueError("Production should not use localhost database")
            if self.SECRET_KEY == "your-super-secret-jwt-key-generate-new-one-for-production":
                raise ValueError("Production must use secure SECRET_KEY")
        return True
    
    class Config:
        env_file = ".env"
        case_sensitive = True        
        validate_assignment = False

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance for better performance"""
    settings = Settings()
    settings.validate_config()
    return settings

settings = get_settings()

def is_production() -> bool:
    """Check if running in production environment"""
    return settings.ENVIRONMENT.lower() == "production"

def is_development() -> bool:
    """Check if running in development environment"""
    return settings.ENVIRONMENT.lower() == "development"

def get_database_url() -> str:
    """Get database URL with validation"""
    if not settings.DATABASE_URL:
        raise ValueError("DATABASE_URL is required")
    return settings.DATABASE_URL

def get_ai_model_config() -> dict:
    """Get AI model configuration"""
    return {
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "spacy_model": settings.SPACY_MODEL_NAME,
        "enable_spacy": settings.ENABLE_SPACY_PROCESSING,
        "enable_gemini": settings.ENABLE_GEMINI_FALLBACK,
        "enable_classifier": settings.ENABLE_ML_CLASSIFIER
    }