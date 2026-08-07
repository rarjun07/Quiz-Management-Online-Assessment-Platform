from fastapi import APIRouter, Depends

from app.dependencies import require_admin
from app.models.user import User
from app.schemas.auth import UserRead

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/me", response_model=UserRead)
def read_admin_profile(current_user: User = Depends(require_admin)) -> User:
    return current_user


@router.get("/dashboard")
def admin_dashboard(current_user: User = Depends(require_admin)) -> dict[str, str]:
    return {
        "message": f"Welcome, Admin {current_user.name}",
        "role": current_user.role.value,
        "next_step": "Add admin statistics and user management endpoints",
    }

