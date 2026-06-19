"""
SevaSetu — GCP Secret Manager Service
======================================
Fetches sensitive API keys from GCP Secret Manager in production.
Falls back gracefully to environment variables / .env in development.

Resolution order for any secret:
  1. In-process cache  (already fetched this session)
  2. GCP Secret Manager  (if GOOGLE_CLOUD_PROJECT is set + client is reachable)
  3. os.environ / .env fallback
  4. Supplied default value
"""

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Secret name registry ─────────────────────────────────────────────────────
# Maps each Settings field name → the GCP secret ID stored in Secret Manager.
# Add new secrets here — the rest of the app just calls get_secret("FIELD_NAME").
SECRET_REGISTRY: dict[str, str] = {
    "GEMINI_API_KEY":       "sevasetu-gemini-api-key",
    "GOOGLE_MAPS_API_KEY":  "sevasetu-google-maps-api-key",
    "DATABASE_URL":         "sevasetu-database-url",
}


class SecretManagerService:
    """
    Thin wrapper around GCP Secret Manager SDK.
    All secrets are cached in-process after the first fetch to avoid repeated
    network calls — Secret Manager has low QPS quotas on the free tier.
    """

    def __init__(self) -> None:
        self._client = None
        self._project_id: Optional[str] = os.environ.get("GOOGLE_CLOUD_PROJECT")
        self._cache: dict[str, str] = {}
        self._available: bool = False
        self._try_init()

    # ─── Initialisation ───────────────────────────────────────────────────────

    def _try_init(self) -> None:
        """Attempt to create a Secret Manager client; silently skip on error."""
        if not self._project_id:
            logger.info(
                "🔑 SecretManager: GOOGLE_CLOUD_PROJECT not set — "
                "using local env vars / .env (dev mode)"
            )
            return

        try:
            from google.cloud import secretmanager  # type: ignore
            self._client = secretmanager.SecretManagerServiceClient()
            self._available = True
            logger.info(
                f"🔑 SecretManager: Connected to GCP project '{self._project_id}'"
            )
        except Exception as exc:
            logger.warning(
                f"⚠️  SecretManager: Could not initialise client ({exc}). "
                "Falling back to environment variables."
            )

    # ─── Public API ───────────────────────────────────────────────────────────

    def get_secret(
        self,
        field_name: str,
        default: Optional[str] = None,
        version: str = "latest",
    ) -> Optional[str]:
        """
        Resolve a secret value for the given Settings field name.

        Args:
            field_name: The Settings attribute name, e.g. "GEMINI_API_KEY".
            default:    Value returned if all resolution steps fail.
            version:    GCP secret version to fetch (default "latest").

        Returns:
            The resolved secret string, or *default* if not found.
        """
        # 1 — cache hit
        if field_name in self._cache:
            return self._cache[field_name]

        # 2 — GCP Secret Manager
        if self._available and self._project_id:
            gcp_id = SECRET_REGISTRY.get(field_name)
            if gcp_id:
                value = self._fetch_from_gcp(gcp_id, version)
                if value is not None:
                    self._cache[field_name] = value
                    return value

        # 3 — environment variable / .env
        env_value = os.environ.get(field_name, default)
        if env_value is not None:
            self._cache[field_name] = env_value
        return env_value

    def inject_into_environ(self, fields: list[str]) -> None:
        """
        Fetch each named field and set it in os.environ so that
        pydantic-settings (BaseSettings) picks it up during Settings()
        construction.  Call this once at application startup BEFORE
        get_settings() is invoked.
        """
        for field in fields:
            value = self.get_secret(field)
            if value and field not in os.environ:
                os.environ[field] = value
                logger.debug(f"🔑 Injected '{field}' into os.environ from SecretManager")

    # ─── Private helpers ──────────────────────────────────────────────────────

    def _fetch_from_gcp(self, secret_id: str, version: str) -> Optional[str]:
        """Call the GCP API and return the secret payload, or None on error."""
        resource_name = (
            f"projects/{self._project_id}/secrets/{secret_id}/versions/{version}"
        )
        try:
            response = self._client.access_secret_version(  # type: ignore[union-attr]
                request={"name": resource_name}
            )
            value = response.payload.data.decode("UTF-8").strip()
            logger.info(
                f"✅ SecretManager: Loaded '{secret_id}' (version={version}) from GCP"
            )
            return value
        except Exception as exc:
            logger.warning(
                f"⚠️  SecretManager: Could not fetch '{secret_id}': {exc}. "
                "Falling back to env var."
            )
            return None

    # ─── Diagnostics ──────────────────────────────────────────────────────────

    @property
    def is_gcp_mode(self) -> bool:
        """True when the service is connected to GCP Secret Manager."""
        return self._available

    @property
    def project_id(self) -> Optional[str]:
        return self._project_id

    def status(self) -> dict:
        return {
            "gcp_mode": self._available,
            "project_id": self._project_id or "not set",
            "cached_secrets": sorted(self._cache.keys()),
            "registered_secrets": sorted(SECRET_REGISTRY.keys()),
        }


# ─── Module-level singleton ────────────────────────────────────────────────────
secret_manager_service = SecretManagerService()
