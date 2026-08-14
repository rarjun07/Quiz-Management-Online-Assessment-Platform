from datetime import datetime

from pydantic import BaseModel, Field

from app.core.constants import UserRole, UserStatus
from app.schemas.auth import UserRead


class AdminDashboardStats(BaseModel):
    total_students: int
    total_admins: int
    total_users: int
    active_users: int
    inactive_users: int
    total_quizzes: int = 0
    published_quizzes: int = 0
    draft_quizzes: int = 0
    unpublished_quizzes: int = 0
    total_quiz_attempts: int = 0
    average_score: float = 0.0


class AdminAnalyticsQuizItem(BaseModel):
    quiz_id: int
    quiz_title: str
    category: str
    attempts: int
    passed_attempts: int
    failed_attempts: int
    average_score: float


class AdminAnalyticsAttemptItem(BaseModel):
    attempt_id: int
    user_name: str
    user_email: str
    quiz_title: str
    submitted_at: datetime
    percentage: float
    passed: bool
    time_taken_seconds: int


class AdminAnalyticsCategoryItem(BaseModel):
    category: str
    quizzes: int
    attempts: int
    passed_attempts: int
    average_score: float


class AdminAnalyticsResponse(BaseModel):
    total_attempts: int
    completed_attempts: int
    passed_attempts: int
    failed_attempts: int
    average_score: float
    best_score: float
    recent_attempts: list[AdminAnalyticsAttemptItem] = Field(default_factory=list)
    quiz_performance: list[AdminAnalyticsQuizItem] = Field(default_factory=list)
    category_performance: list[AdminAnalyticsCategoryItem] = Field(default_factory=list)


class UserStatusUpdate(BaseModel):
    is_active: bool
    status: UserStatus


class AdminUserListResponse(BaseModel):
    items: list[UserRead]
    total: int
    search: str | None = None
    role: UserRole | None = None
    status: UserStatus | None = None
