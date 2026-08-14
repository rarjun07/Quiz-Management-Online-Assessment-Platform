from datetime import datetime

from pydantic import BaseModel, Field


class QuizBase(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str | None = Field(default=None, max_length=2000)
    category: str = Field(min_length=2, max_length=100)
    difficulty: str = Field(default="Intermediate", min_length=3, max_length=50)
    duration: int = Field(default=20, ge=1, le=300)
    passing_score: int = Field(default=60, ge=1, le=100)
    max_attempts: int = Field(default=1, ge=1, le=10)
    thumbnail_url: str | None = Field(default=None, max_length=255)


class QuizCreate(QuizBase):
    status: str = Field(default="DRAFT", pattern="^(DRAFT|PUBLISHED|UNPUBLISHED)$")


class QuizUpdate(QuizBase):
    status: str = Field(pattern="^(DRAFT|PUBLISHED|UNPUBLISHED)$")


class QuizPublishUpdate(BaseModel):
    is_published: bool
    status: str = Field(pattern="^(DRAFT|PUBLISHED|UNPUBLISHED)$")


class QuizRead(QuizBase):
    id: int
    status: str
    is_published: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QuizListResponse(BaseModel):
    items: list[QuizRead]
    total: int
    search: str | None = None
    status: str | None = None


class QuizDashboardStats(BaseModel):
    total_quizzes: int
    published_quizzes: int
    draft_quizzes: int
    unpublished_quizzes: int
