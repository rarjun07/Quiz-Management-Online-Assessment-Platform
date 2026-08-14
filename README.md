# Quiz Management & Online Assessment Platform

Full-stack internship project for an online quiz management and assessment system.

## Stack

- Frontend: React
- Backend: FastAPI with Python
- Database: PostgreSQL

## Project goals

- Admin and student authentication
- Quiz, category, and question management
- Timed quiz attempts and automatic scoring
- Results, history, analytics, and leaderboard

## Day 1 scope

- Project setup
- Backend setup
- Frontend setup
- Database setup
- Git repository setup
- Environment configuration

## Repository layout

- `backend/` - FastAPI application
- `frontend/` - React application
- `docker-compose.yml` - PostgreSQL service
- `.env.example` - local environment template

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

## Next step

Implement authentication, token handling, and protected routes for Day 2.
