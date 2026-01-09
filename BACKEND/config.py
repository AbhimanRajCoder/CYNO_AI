"""
CYNO Healthcare - Configuration Management
Centralized configuration using environment variables
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from dataclasses import dataclass

# Load environment variables from .env file
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).resolve().parent


class Settings:
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "file:./prisma/dev.db")
    
    # JWT Authentication
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY", 
        "cyno-healthcare-super-secret-key-change-in-production"
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # CORS Configuration
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    ALLOWED_ORIGINS: list = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    
    # File Upload Configuration
    UPLOAD_DIR: Path = BASE_DIR / os.getenv("UPLOAD_DIR", "uploads")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024
    
    # AI Integration (Future)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    @classmethod
    def ensure_directories(cls):
        """Ensure required directories exist"""
        cls.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# =============================================================================
# LLM MODEL CONFIGURATION
# =============================================================================

@dataclass
class LLMConfig:
    """Configuration for a single LLM model."""
    name: str
    temperature: float = 0.1
    num_predict: int = 4096
    num_ctx: int = 8192
    top_k: int = 20
    top_p: float = 0.9
    
    def to_options(self) -> dict:
        """Convert to Groq-compatible options dict."""
        return {
            "temperature": self.temperature,
            "num_predict": self.num_predict,
            "num_ctx": self.num_ctx,
            "top_k": self.top_k,
            "top_p": self.top_p
        }


class LLMModels:
    """Centralized LLM model name definitions (Groq API)."""
    
    # OCR Pipeline Models (Groq)
    LLM_A = os.getenv("LLM_A_MODEL", "llama-3.3-70b-versatile")          # Structural extraction
    LLM_B = os.getenv("LLM_B_MODEL", "llama-3.1-8b-instant")             # Validation/filtering
    
    # Tumor Board Models (Groq)
    TUMOR_BOARD_MAIN = os.getenv("TUMOR_BOARD_MODEL", "llama-3.3-70b-versatile")
    TUMOR_BOARD_AGENTS = os.getenv("TUMOR_AGENTS_MODEL", "llama-3.1-8b-instant")
    
    # Agent-specific (can override via env)
    RADIOLOGY_AGENT = os.getenv("RADIOLOGY_AGENT_MODEL", "llama-3.1-8b-instant")
    PATHOLOGY_AGENT = os.getenv("PATHOLOGY_AGENT_MODEL", "llama-3.3-70b-versatile")
    CLINICAL_AGENT = os.getenv("CLINICAL_AGENT_MODEL", "llama-3.1-8b-instant")
    RESEARCH_AGENT = os.getenv("RESEARCH_AGENT_MODEL", "llama-3.3-70b-versatile")
    COORDINATOR_AGENT = os.getenv("COORDINATOR_AGENT_MODEL", "llama-3.3-70b-versatile")


class LLMConfigs:
    """Pre-configured LLM settings for different use cases."""
    
    # LLM-A: Precise extraction
    LLM_A = LLMConfig(
        name=LLMModels.LLM_A,
        temperature=0.05,
        num_predict=4096,
        num_ctx=8192,
        top_k=10,
        top_p=0.85
    )
    
    # LLM-B: Strict validation
    LLM_B = LLMConfig(
        name=LLMModels.LLM_B,
        temperature=0.1,
        num_predict=2048,
        num_ctx=4096,
        top_k=10,
        top_p=0.9
    )
    
    # Tumor Board main analysis
    TUMOR_BOARD = LLMConfig(
        name=LLMModels.TUMOR_BOARD_MAIN,
        temperature=0.2,
        num_predict=4096,
        num_ctx=8192,
        top_k=20,
        top_p=0.9
    )
    
    # Agent default settings
    AGENT_DEFAULT = LLMConfig(
        name=LLMModels.TUMOR_BOARD_AGENTS,
        temperature=0.15,
        num_predict=2048,
        num_ctx=4096,
        top_k=15,
        top_p=0.9
    )


class ProcessingConfig:
    """Processing configuration settings."""
    
    # OCR
    OCR_MIN_CONFIDENCE = float(os.getenv("OCR_MIN_CONFIDENCE", "0.6"))
    OCR_MAX_DPI = int(os.getenv("OCR_MAX_DPI", "300"))
    OCR_CACHE_MAX_SIZE = int(os.getenv("OCR_CACHE_MAX_SIZE", "100"))
    
    # LLM-B skip threshold
    LLM_B_SKIP_THRESHOLD = float(os.getenv("LLM_B_SKIP_THRESHOLD", "0.8"))
    
    # Concurrency
    MAX_CONCURRENT_LLM_CALLS = int(os.getenv("MAX_CONCURRENT_LLM", "2"))
    MAX_OCR_WORKERS = int(os.getenv("MAX_OCR_WORKERS", "4"))
    
    # Timeouts
    SECONDS_PER_PAGE = int(os.getenv("SECONDS_PER_PAGE", "60"))
    SECONDS_PER_REPORT = int(os.getenv("SECONDS_PER_REPORT", "300"))
    
    # Tumor Board
    TUMOR_BOARD_MAX_AGENTS = int(os.getenv("TUMOR_BOARD_MAX_AGENTS", "2"))


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_llm_config(model_type: str) -> LLMConfig:
    """Get model configuration by type."""
    configs = {
        "llm_a": LLMConfigs.LLM_A,
        "llm_b": LLMConfigs.LLM_B,
        "tumor_board": LLMConfigs.TUMOR_BOARD,
        "agent": LLMConfigs.AGENT_DEFAULT,
    }
    return configs.get(model_type, LLMConfigs.AGENT_DEFAULT)


def get_model_name(model_type: str) -> str:
    """Get model name by type."""
    models = {
        "llm_a": LLMModels.LLM_A,
        "llm_b": LLMModels.LLM_B,
        "tumor_board": LLMModels.TUMOR_BOARD_MAIN,
        "radiology": LLMModels.RADIOLOGY_AGENT,
        "pathology": LLMModels.PATHOLOGY_AGENT,
        "clinical": LLMModels.CLINICAL_AGENT,
        "research": LLMModels.RESEARCH_AGENT,
        "coordinator": LLMModels.COORDINATOR_AGENT,
    }
    return models.get(model_type, LLMModels.TUMOR_BOARD_AGENTS)


# =============================================================================
# INSTANCE CREATION
# =============================================================================

# Create settings instance
settings = Settings()

# Ensure directories exist on import
settings.ensure_directories()
