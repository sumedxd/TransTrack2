import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "TransTrack 2 — AI-Powered MPLADS Risk & Investigation System"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/transtrack2.db")
    
    # LLM Settings (Optional - fallback rule synthesizer used if missing)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_LLM_PROVIDER: str = os.getenv("DEFAULT_LLM_PROVIDER", "auto")  # 'gemini', 'openai', or 'rule_based'
    
    # Default Risk Weights (Must sum to 1.0)
    WEIGHT_FINANCIAL: float = 0.30
    WEIGHT_PROGRESS: float = 0.25
    WEIGHT_ANOMALY: float = 0.25
    WEIGHT_GEOGRAPHIC: float = 0.20
    
    # Risk Thresholds
    THRESHOLD_LOW: float = 30.0
    THRESHOLD_MEDIUM: float = 60.0
    THRESHOLD_HIGH: float = 80.0
    # 81-100 is CRITICAL
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
