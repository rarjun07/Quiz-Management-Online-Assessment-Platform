from pydantic import BaseModel

from app.core.constants import UserRole, UserStatus
from app.schemas.auth import UserRead


class AdminDashboardStats(BaseModel):
    total_students: int
    total_admins: int
    total_users: int
    active_users: int
    inactive_users: int
    published_quizzes: int = 0
    draft_quizzes: int = 0
    total_quiz_attempts: int = 0
    average_score: float = 0.0


class UserStatusUpdate(BaseModel):
    is_active: bool
    status: UserStatus


class AdminUserListResponse(BaseModel):
    items: list[UserRead]
    total: int
    search: str | None = None
    role: UserRole | None = None
    status: UserStatus | None = None

