from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.constants import UserRole, UserStatus
from app.crud.admin import delete_user, get_user_by_id, list_users, update_user_status
from app.crud.quiz import create_quiz, delete_quiz, get_quiz_by_id, list_quizzes, update_quiz, update_quiz_publish_state
from app.dependencies import require_admin
from app.dependencies import get_db
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.admin import AdminDashboardStats, AdminUserListResponse, UserStatusUpdate
from app.schemas.auth import UserRead
from app.schemas.quiz import QuizCreate, QuizListResponse, QuizPublishUpdate, QuizRead, QuizUpdate

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/me", response_model=UserRead)
def read_admin_profile(current_user: User = Depends(require_admin)) -> User:
    return current_user


@router.get("/dashboard", response_model=AdminDashboardStats)
def admin_dashboard(
    db: Session = Depends(get_db), current_user: User = Depends(require_admin)
) -> AdminDashboardStats:
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_students = db.query(func.count(User.id)).filter(User.role == UserRole.student).scalar() or 0
    total_admins = db.query(func.count(User.id)).filter(User.role == UserRole.admin).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    inactive_users = db.query(func.count(User.id)).filter(User.is_active.is_(False)).scalar() or 0
    total_quizzes = db.query(func.count(Quiz.id)).scalar() or 0
    published_quizzes = db.query(func.count(Quiz.id)).filter(Quiz.is_published.is_(True)).scalar() or 0
    draft_quizzes = db.query(func.count(Quiz.id)).filter(Quiz.status == "DRAFT").scalar() or 0
    unpublished_quizzes = db.query(func.count(Quiz.id)).filter(Quiz.is_published.is_(False)).scalar() or 0

    return AdminDashboardStats(
        total_students=total_students,
        total_admins=total_admins,
        total_users=total_users,
        active_users=active_users,
        inactive_users=inactive_users,
        total_quizzes=total_quizzes,
        published_quizzes=published_quizzes,
        draft_quizzes=draft_quizzes,
        unpublished_quizzes=unpublished_quizzes,
        total_quiz_attempts=0,
        average_score=0.0,
    )


@router.get("/users", response_model=AdminUserListResponse)
def read_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    search: str | None = Query(default=None, min_length=1, max_length=100),
    role: UserRole | None = Query(default=None),
    status_filter: UserStatus | None = Query(default=None, alias="status"),
) -> AdminUserListResponse:
    users, total = list_users(db, search=search, role=role, status=status_filter)
    return AdminUserListResponse(
        items=users,
        total=total,
        search=search,
        role=role,
        status=status_filter,
    )


@router.get("/users/{user_id}", response_model=UserRead)
def read_user(
    user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)
) -> User:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/users/{user_id}/status", response_model=UserRead)
def change_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> User:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return update_user_status(db, user, is_active=payload.is_active, status=payload.status)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(
    user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)
) -> None:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    delete_user(db, user)


@router.get("/quizzes", response_model=QuizListResponse)
def read_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    search: str | None = Query(default=None, min_length=1, max_length=100),
    status_filter: str | None = Query(default=None, alias="status"),
) -> QuizListResponse:
    quizzes, total = list_quizzes(db, search=search, status=status_filter)
    return QuizListResponse(items=quizzes, total=total, search=search, status=status_filter)


@router.post("/quizzes", response_model=QuizRead, status_code=status.HTTP_201_CREATED)
def add_quiz(
    payload: QuizCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)
) -> Quiz:
    return create_quiz(db, payload)


@router.get("/quizzes/{quiz_id}", response_model=QuizRead)
def read_quiz(
    quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)
) -> Quiz:
    quiz = get_quiz_by_id(db, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return quiz


@router.put("/quizzes/{quiz_id}", response_model=QuizRead)
def edit_quiz(
    quiz_id: int,
    payload: QuizUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Quiz:
    quiz = get_quiz_by_id(db, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return update_quiz(db, quiz, payload)


@router.patch("/quizzes/{quiz_id}/publish", response_model=QuizRead)
def set_quiz_publish_state(
    quiz_id: int,
    payload: QuizPublishUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Quiz:
    quiz = get_quiz_by_id(db, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return update_quiz_publish_state(db, quiz, is_published=payload.is_published, status=payload.status)


@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_quiz(
    quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)
) -> None:
    quiz = get_quiz_by_id(db, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    delete_quiz(db, quiz)
