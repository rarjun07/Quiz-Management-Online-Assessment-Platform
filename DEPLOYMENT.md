# Deployment Checklist

## Required Environment

- `DATABASE_URL`: production PostgreSQL connection string.
- `SECRET_KEY`: long random secret; never use the example value in production.
- `ALGORITHM`: default `HS256`.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: default `30`.
- `PASSWORD_RESET_TOKEN_EXPIRE_MINUTES`: default `15`.
- `EXPOSE_PASSWORD_RESET_TOKEN`: keep `false` in production.
- `RATE_LIMIT_PER_MINUTE`: default `20`.
- `VITE_API_URL`: public backend API URL ending in `/api/v1`.
- `FRONTEND_URL`: public frontend URL used in password reset email text.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_USE_TLS`: mail server settings for password reset delivery.

## Local Full-Stack Docker Run

```bash
docker compose up --build
```

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:8000`
- API docs: `http://127.0.0.1:8000/docs`

## Production Steps

1. Create a managed PostgreSQL database.
2. Deploy `backend/` with `backend/Dockerfile`.
3. Set backend environment variables from the required environment list.
4. Run `alembic upgrade head` against the production database.
5. Deploy `frontend/` with `frontend/Dockerfile`.
6. Set `VITE_API_URL` to the deployed backend API URL before building the frontend.
7. Restrict backend CORS origins to the deployed frontend domain.
8. Keep `EXPOSE_PASSWORD_RESET_TOKEN=false`; configure SMTP variables for public password reset use.
9. Run backend tests and frontend build before release:

```bash
cd backend && pytest -q
cd ../frontend && npm run build
```

## Production Notes

- The backend now returns security headers and rate-limits authentication endpoints.
- Password reset uses signed, short-lived reset tokens and sends them by SMTP when mail settings are configured.
- Alembic migrations are included. `Base.metadata.create_all` is acceptable for local development only.
