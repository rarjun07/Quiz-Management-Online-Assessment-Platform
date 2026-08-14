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


class StudentAttemptAnswerIn(BaseModel):
    question_id: int
    selected_option_id: int | None = None


class StudentAttemptSubmitRequest(BaseModel):
    answers: list[StudentAttemptAnswerIn] = Field(default_factory=list)


class StudentAttemptQuestionResult(BaseModel):
    question_id: int
    question_text: str
    selected_option_id: int | None = None
    selected_option_text: str | None = None
    correct_option_id: int | None = None
    correct_option_text: str | None = None
    marks: int
    marks_awarded: int
    is_correct: bool
    explanation: str | None = None


class StudentAttemptSubmitResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    quiz_title: str
    total_questions: int
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    score: int
    total_marks: int
    percentage: float
    passing_score: int
    passed: bool
    status: str
    submitted_at: datetime
    time_taken_seconds: int
    results: list[StudentAttemptQuestionResult] = Field(default_factory=list)


class StudentAttemptHistoryItem(BaseModel):
    attempt_id: int
    quiz_id: int
    quiz_title: str
    status: str
    started_at: datetime
    expires_at: datetime
    submitted_at: datetime | None = None
    score: int | None = None
    total_marks: int | None = None
    percentage: float | None = None
    correct_count: int | None = None
    incorrect_count: int | None = None
    unanswered_count: int | None = None
    passed: bool | None = None
    time_taken_seconds: int | None = None


class StudentAttemptHistoryResponse(BaseModel):
    items: list[StudentAttemptHistoryItem] = Field(default_factory=list)
    total: int
