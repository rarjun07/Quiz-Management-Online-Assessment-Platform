# Quiz Management Platform

FastAPI + React + PostgreSQL starter for the quiz management and online assessment project.

## Stack

- Backend: FastAPI, Python
- Frontend: React
- Database: PostgreSQL

## Day 1 scope

- Project setup
- Backend setup
- Frontend setup
- Database setup
- Git repository setup
- Environment configuration

## Project layout

- `backend/` - FastAPI application
- `frontend/` - React application
- `docker-compose.yml` - PostgreSQL service

## Run the stack

1. Start PostgreSQL:

```bash
docker compose up -d db
```

2. Run backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

3. Run frontend:

```bash
cd frontend
npm install
npm run dev
```

