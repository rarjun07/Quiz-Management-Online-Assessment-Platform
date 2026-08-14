from datetime import datetime

from pydantic import BaseModel, Field


class StudentOptionRead(BaseModel):
    id: int
    option_text: str

    model_config = {"from_attributes": True}


class StudentQuestionRead(BaseModel):
    id: int
    question_text: str
    marks: int
    explanation: str | None = None
    difficulty: str
    options: list[StudentOptionRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class StudentQuizListItem(BaseModel):
    id: int
    title: str
    description: str | None = None
    category: str
    difficulty: str
    duration: int
    passing_score: int
    max_attempts: int
    status: str
    is_published: bool
    questions_count: int

    model_config = {"from_attributes": True}


class StudentQuizListResponse(BaseModel):
    items: list[StudentQuizListItem]
    total: int
    search: str | None = None


class StudentQuizDetail(BaseModel):
    id: int
    title: str
    description: str | None = None
    category: str
    difficulty: str
    duration: int
    passing_score: int
    max_attempts: int
    status: str
    is_published: bool
    questions_count: int
    questions: list[StudentQuestionRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class StudentQuizStartResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    started_at: datetime
    expires_at: datetime
    duration: int
    question_count: int
