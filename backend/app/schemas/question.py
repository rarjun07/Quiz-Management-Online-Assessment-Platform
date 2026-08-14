from datetime import datetime

from pydantic import BaseModel, Field


class QuestionOptionBase(BaseModel):
    option_text: str = Field(min_length=1, max_length=200)
    is_correct: bool = False


class QuestionOptionRead(QuestionOptionBase):
    id: int

    model_config = {"from_attributes": True}


class QuestionBase(BaseModel):
    quiz_id: int
    question_text: str = Field(min_length=3, max_length=5000)
    marks: int = Field(default=1, ge=1, le=100)
    explanation: str | None = Field(default=None, max_length=5000)
    difficulty: str = Field(default="Intermediate", min_length=3, max_length=50)
    options: list[QuestionOptionBase] = Field(min_length=2, max_length=6)


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(QuestionBase):
    pass


class QuestionRead(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    marks: int
    explanation: str | None
    difficulty: str
    options: list[QuestionOptionRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QuestionListResponse(BaseModel):
    items: list[QuestionRead]
    total: int
    quiz_id: int | None = None
