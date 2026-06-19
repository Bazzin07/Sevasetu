"""
SevaSetu — Configuration
Environment-based settings with Pydantic BaseSettings.

Secret resolution order (per sensitive field):
  1. GCP Secret Manager  — when GOOGLE_CLOUD_PROJECT is set (production / Cloud Run)
  2. os.environ / .env   — local development fallback
"""

import os
import logging
from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache

logger = logging.getLogger(__name__)

# ─── Sensitive fields managed by GCP Secret Manager ──────────────────────────
# These are fetched from Secret Manager in production and injected into
# os.environ BEFORE pydantic-settings reads them, so Settings() stays clean.
_SECRET_MANAGED_FIELDS = [
    "GEMINI_API_KEY",
    "GOOGLE_MAPS_API_KEY",
    "DATABASE_URL",
]


def _bootstrap_secrets() -> None:
    """
    Called once at module-import time.
    If GOOGLE_CLOUD_PROJECT is set (i.e. we are on Cloud Run / GCP), fetch
    the managed secrets from Secret Manager and push them into os.environ.
    Local .env values are left untouched and serve as the fallback.
    """
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
    if not project_id:
        # Development — .env supplies everything, skip Secret Manager entirely.
        return

    try:
        from app.services.secret_manager_service import secret_manager_service  # noqa
        secret_manager_service.inject_into_environ(_SECRET_MANAGED_FIELDS)
        logger.info("🔑 Secrets bootstrapped from GCP Secret Manager.")
    except Exception as exc:
        logger.warning(
            f"⚠️  Secret bootstrap failed ({exc}). "
            "Falling back to environment variables."
        )


# Run once at import time — before any get_settings() call.
_bootstrap_secrets()


# ─── Application Settings ─────────────────────────────────────────────────────

class Settings(BaseSettings):
    """Application configuration loaded from environment variables / Secret Manager."""

    # ─── Database ────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://sevasetu:sevasetu_dev_2024@localhost:5433/sevasetu"

    # ─── Google AI ───────────────────────────────────────────
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_MAPS_API_KEY: Optional[str] = None

    # ─── Firebase ────────────────────────────────────────────
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_DEV_BYPASS: bool = False  # Set True in .env to skip auth in dev

    # ─── Google Cloud ────────────────────────────────────────
    GOOGLE_CLOUD_PROJECT: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    # ─── Feature Flags ───────────────────────────────────────
    ENABLE_WHATSAPP: bool = False
    ENABLE_SHEETS_SYNC: bool = False
    DISASTER_MODE_THRESHOLD: int = 10          # Urban areas
    DISASTER_MODE_LOW_DENSITY_THRESHOLD: int = 5  # Rural/tribal areas

    # ─── App ─────────────────────────────────────────────────
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"
    LOG_LEVEL: str = "INFO"
    APP_VERSION: str = "0.1.0"
    REDIS_URL: Optional[str] = None  # e.g. redis://localhost:6379/0

    # ─── Embedding ───────────────────────────────────────────
    EMBEDDING_MODEL: str = "paraphrase-multilingual-MiniLM-L12-v2"
    EMBEDDING_DIM: int = 384

    # ─── Matching ────────────────────────────────────────────
    MATCH_WEIGHT_SKILL_EMBEDDING: float = 0.30
    MATCH_WEIGHT_SKILL_TAGS: float = 0.25
    MATCH_WEIGHT_GEO_PROXIMITY: float = 0.20
    MATCH_WEIGHT_URGENCY: float = 0.15
    MATCH_WEIGHT_AVAILABILITY: float = 0.10
    DEFAULT_SEARCH_RADIUS_KM: float = 25.0
    MAX_MATCH_CANDIDATES: int = 200

    # ─── Urgency Decay ───────────────────────────────────────
    URGENCY_DECAY_RATE: float = 0.15
    URGENCY_TIER1_THRESHOLD: float = 0.70
    URGENCY_TIER2_THRESHOLD: float = 0.85
    URGENCY_CRITICAL_THRESHOLD: float = 0.95

    # ─── Dedup ───────────────────────────────────────────────
    DEDUP_COSINE_THRESHOLD: float = 0.90
    DEDUP_WINDOW_DAYS: int = 7

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — loaded once on first call."""
    return Settings()

