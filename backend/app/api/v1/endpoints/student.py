from fastapi import APIRouter, Depends

from app.dependencies import require_student
from app.models.user import User
from app.schemas.auth import UserRead

router = APIRouter(prefix="/student", tags=["Student"])


@router.get("/me", response_model=UserRead)
def read_student_profile(current_user: User = Depends(require_student)) -> User:
    return current_user


@router.get("/dashboard")
def student_dashboard(current_user: User = Depends(require_student)) -> dict[str, str]:
    return {
        "message": f"Welcome, Student {current_user.name}",
        "role": current_user.role.value,
        "next_step": "Add quiz discovery, attempt history, and performance endpoints",
    }

