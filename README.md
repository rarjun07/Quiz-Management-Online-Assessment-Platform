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

## Day 2 progress

- Student registration and login routes are wired
- JWT auth helpers are in place
- Current-user and logout endpoints are available
- Frontend auth screen is connected to the backend API

## Day 3 progress

- Admin and student role guards are already enforced in the backend
- Frontend now reflects the signed-in role
- Protected admin and student route probes are visible in the UI
- Admin-only and student-only dashboard sections are separated in the app

## Day 4 progress

- Admin dashboard statistics are shown in the frontend
- Admin user management list is connected to the backend
- Search, status filter, activate/deactivate, and delete actions are exposed
- Admin route probes and dashboard layout are now part of the UI

## Day 5 progress

- Quiz CRUD endpoints are available for admins
- Publish and unpublish flow is supported
- Quiz creation and editing forms are added in the admin UI
- Quiz listing, filtering, updating, and deletion are wired to the backend

## Day 6 progress

- Category CRUD endpoints are available for admins
- Question CRUD endpoints with options are available for admins
- Admin UI includes category and question management panels
- Questions can be attached to a selected quiz and edited or deleted

## Day 7 progress

- Student quiz listing is available for published quizzes
- Quiz details load without exposing correct answers
- Start quiz creates a timed attempt record
- Student UI includes quiz browsing, question navigation, and answer selection

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
