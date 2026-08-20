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
    cors_origins: str = ""
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

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return self.database_url

    @property
    def allowed_cors_origins(self) -> list[str]:
        origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
        if self.frontend_url:
            origins.append(self.frontend_url.rstrip("/"))
        if self.cors_origins:
            origins.extend(origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip())
        return sorted(set(origins))


settings = Settings()
