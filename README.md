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
- Admin-only and student-only dashboard sections are separated in the app

## Day 4 progress

- Admin dashboard statistics are shown in the frontend
- Admin user management list is connected to the backend
- Search, status filter, activate/deactivate, and delete actions are exposed
- Admin dashboard layout is now part of the UI

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

## Day 8 progress

- Quiz submission is supported from the student UI
- Automatic submission runs when the timer expires
- Backend calculates score, percentage, and pass/fail status
- Submission results are returned with question-level scoring

## Day 9 progress

- Result pages show answer review and explanations
- Correct and incorrect answers are highlighted
- Attempt history is stored and listed for students
- Full review views are available for submitted attempts

## Day 10 progress

- Student dashboard shows total attempts and completion stats
- Average score, best score, and total time spent are displayed
- Score trend and category performance summaries are available
- Recent attempts are shown in the student dashboard

## Day 11 progress

- Admin analytics are available from the backend
- Quiz-level and category-level performance summaries are shown
- Recent completed attempts are listed for admins
- Admin dashboard now includes total quiz attempts and average score

## Day 12 progress

- Overall student leaderboard is available
- Category-based leaderboard is available
- Ranking uses completed attempt performance
- Leaderboard tabs are shown in the student UI

## Day 13 progress

- Backend tests cover authentication, permissions, quiz flow, and validation
- Invalid quiz submissions are rejected
- Max-attempt enforcement is applied on quiz start
- Time handling is normalized for reliable scoring and testing

## Day 14 progress

- Backend and frontend Dockerfiles are included
- Docker Compose can run database, backend, and frontend services
- Production environment variables are documented
- Security headers and auth rate limiting are enabled
- Alembic initial schema migration is included
- Deployment checklist is available in `DEPLOYMENT.md`

## Repository layout

- `backend/` - FastAPI application
- `frontend/` - React application
- `docker-compose.yml` - PostgreSQL service
- `.env.example` - local environment template

## Run the stack

1. Start PostgreSQL only:

```bash
docker compose up -d db
```

2. Run backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

3. Run frontend:

```bash
cd frontend
npm install
npm run dev
```

## Run the full stack with Docker

```bash
docker compose up --build
```

## Next step

Configure a production email provider for password reset delivery and add database migrations before live deployment.
