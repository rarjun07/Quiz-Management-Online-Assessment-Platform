from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.db.session import Base, engine
from app.models.category import Category  # noqa: F401
from app.models.option import Option  # noqa: F401
from app.models.question import Question  # noqa: F401
from app.models.quiz import Quiz  # noqa: F401
from app.models.user import User  # noqa: F401

app = FastAPI(title="Quiz Management API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
def create_database_tables() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Quiz Management API"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "quiz-management-api"}
