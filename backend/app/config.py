from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Legal Response Monolith MVP"
    app_env: str = "dev"
    database_url: str = "postgresql://postgres:password@localhost:5433/legal_mvp"

    # Google Vertex AI settings
    gcp_project: str = Field(
        default="",
        validation_alias=AliasChoices("GCP_PROJECT", "GCP_PROJECT_ID"),
    )
    gcp_region: str = Field(
        default="us-central1",
        validation_alias=AliasChoices("GCP_REGION", "GCP_LOCATION"),
    )
    vertex_model_name: str = Field(
        default="gemini-2.0-flash",
        validation_alias=AliasChoices("VERTEX_MODEL_NAME", "GCP_MODEL_NAME"),
    )
    gcp_model_fallbacks: str = Field(default="", validation_alias=AliasChoices("GCP_MODEL_FALLBACKS"))
    gcp_service_account_file: str = Field(
        default="",
        validation_alias=AliasChoices("GCP_SERVICE_ACCOUNT_FILE", "GOOGLE_APPLICATION_CREDENTIALS"),
    )

    max_response_seconds: int = 10
    secret_key: str = "supersecretkey"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
