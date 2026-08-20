from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Quiz Management API"
    database_url: str = "postgresql+psycopg://quiznest_user:quiznest_password@localhost:5432/quiznest_db"
    secret_key: str = "change-this-to-a-long-random-secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    password_reset_token_expire_minutes: int = 15
    expose_password_reset_token: bool = False
    rate_limit_per_minute: int = 20
    frontend_url: str = "http://127.0.0.1:5173"
    initial_admin_name: str = "Admin User"
    initial_admin_email: str | None = "admin@example.com"
    initial_admin_password: str | None = "admin12345"
    initial_admin_sync_password: bool = True
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_use_tls: bool = True


settings = Settings()
