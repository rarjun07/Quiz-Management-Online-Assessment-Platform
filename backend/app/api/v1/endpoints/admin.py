from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.orm import Session

from app.core.constants import UserRole, UserStatus
from app.crud.category import create_category, delete_category, get_category_by_id, list_categories, update_category
from app.crud.admin import delete_user, get_user_by_id, list_users, update_user_status
from app.crud.notification import notify_active_students
from app.crud.question import create_question, delete_question, get_question_by_id, list_questions, update_question
from app.crud.quiz import create_quiz, delete_quiz, get_quiz_by_id, list_quizzes, update_quiz, update_quiz_publish_state
from app.dependencies import require_admin
from app.dependencies import get_db
from app.api.v1.endpoints.student import build_attempt_review_response
from app.models.attempt import Attempt
from app.models.attempt_result import AttemptResult
from app.models.category import Category
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryListResponse, CategoryRead, CategoryUpdate
from app.schemas.admin import (
    AdminAttemptListItem,
    AdminAttemptListResponse,
    AdminAnalyticsAttemptItem,
    AdminAnalyticsCategoryItem,
    AdminAnalyticsQuizItem,
    AdminAnalyticsResponse,
    AdminDashboardStats,
    AdminUserListResponse,
    UserStatusUpdate,
)
from app.schemas.auth import UserRead
from app.schemas.question import QuestionCreate, QuestionListResponse, QuestionRead, QuestionUpdate
from app.schemas.quiz import QuizCreate, QuizListResponse, QuizPublishUpdate, QuizRead, QuizUpdate
from app.schemas.student_quiz import StudentAttemptSubmitResponse

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
    total_quiz_attempts = db.query(func.count(AttemptResult.id)).scalar() or 0
    average_score = db.query(func.avg(AttemptResult.percentage)).scalar() or 0.0

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
        total_quiz_attempts=total_quiz_attempts,
        average_score=round(float(average_score), 2),
    )


@router.get("/analytics", response_model=AdminAnalyticsResponse)
def admin_analytics(
    db: Session = Depends(get_db), current_user: User = Depends(require_admin)
) -> AdminAnalyticsResponse:
    attempt_rows = (
        db.query(Attempt, AttemptResult, Quiz, User)
        .join(AttemptResult, AttemptResult.attempt_id == Attempt.id)
        .join(Quiz, Quiz.id == Attempt.quiz_id)
        .join(User, User.id == Attempt.user_id)
        .order_by(AttemptResult.submitted_at.desc())
        .all()
    )

    total_attempts = db.query(func.count(Attempt.id)).scalar() or 0
    completed_attempts = len(attempt_rows)
    passed_attempts = sum(1 for _, result, _, _ in attempt_rows if result.passed)
    failed_attempts = completed_attempts - passed_attempts
    average_score = round(sum(result.percentage for _, result, _, _ in attempt_rows) / completed_attempts, 2) if completed_attempts else 0.0
    best_score = round(max((result.percentage for _, result, _, _ in attempt_rows), default=0.0), 2)

    recent_attempts = [
        AdminAnalyticsAttemptItem(
            attempt_id=attempt.id,
            user_name=user.name,
            user_email=user.email,
            quiz_title=quiz.title,
            submitted_at=result.submitted_at,
            percentage=result.percentage,
            passed=result.passed,
            time_taken_seconds=result.time_taken_seconds,
        )
        for attempt, result, quiz, user in attempt_rows[:10]
    ]

    quiz_bucket: dict[int, dict[str, object]] = {}
    category_bucket: dict[str, dict[str, object]] = {}
    for attempt, result, quiz, _user in attempt_rows:
        quiz_entry = quiz_bucket.setdefault(
            quiz.id,
            {
                "quiz_title": quiz.title,
                "category": quiz.category,
                "attempts": 0,
                "passed_attempts": 0,
                "total_percentage": 0.0,
            },
        )
        quiz_entry["attempts"] = int(quiz_entry["attempts"]) + 1
        quiz_entry["passed_attempts"] = int(quiz_entry["passed_attempts"]) + (1 if result.passed else 0)
        quiz_entry["total_percentage"] = float(quiz_entry["total_percentage"]) + float(result.percentage)

        category_entry = category_bucket.setdefault(
            quiz.category,
            {"quizzes": set(), "attempts": 0, "passed_attempts": 0, "total_percentage": 0.0},
        )
        category_entry["quizzes"].add(quiz.id)  # type: ignore[union-attr]
        category_entry["attempts"] = int(category_entry["attempts"]) + 1
        category_entry["passed_attempts"] = int(category_entry["passed_attempts"]) + (1 if result.passed else 0)
        category_entry["total_percentage"] = float(category_entry["total_percentage"]) + float(result.percentage)

    quiz_performance = [
        AdminAnalyticsQuizItem(
            quiz_id=quiz_id,
            quiz_title=str(values["quiz_title"]),
            category=str(values["category"]),
            attempts=int(values["attempts"]),
            passed_attempts=int(values["passed_attempts"]),
            failed_attempts=int(values["attempts"]) - int(values["passed_attempts"]),
            average_score=round(float(values["total_percentage"]) / int(values["attempts"]), 2),
        )
        for quiz_id, values in sorted(quiz_bucket.items(), key=lambda item: item[1]["attempts"], reverse=True)
    ]

    category_performance = [
        AdminAnalyticsCategoryItem(
            category=category,
            quizzes=len(values["quizzes"]),
            attempts=int(values["attempts"]),
            passed_attempts=int(values["passed_attempts"]),
            average_score=round(float(values["total_percentage"]) / int(values["attempts"]), 2),
        )
        for category, values in sorted(category_bucket.items(), key=lambda item: item[1]["attempts"], reverse=True)
    ]

    return AdminAnalyticsResponse(
        total_attempts=total_attempts,
        completed_attempts=completed_attempts,
        passed_attempts=passed_attempts,
        failed_attempts=failed_attempts,
        average_score=average_score,
        best_score=best_score,
        recent_attempts=recent_attempts,
        quiz_performance=quiz_performance,
        category_performance=category_performance,
    )


@router.get("/attempts", response_model=AdminAttemptListResponse)
def read_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    search: str | None = Query(default=None, min_length=1, max_length=100),
    status_filter: str | None = Query(default=None, alias="status"),
) -> AdminAttemptListResponse:
    query = (
        db.query(Attempt, Quiz, User, AttemptResult)
        .join(Quiz, Quiz.id == Attempt.quiz_id)
        .join(User, User.id == Attempt.user_id)
        .outerjoin(AttemptResult, AttemptResult.attempt_id == Attempt.id)
    )
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(Quiz.title.ilike(term), Quiz.category.ilike(term), User.name.ilike(term), User.email.ilike(term))
        )
    if status_filter:
        query = query.filter(Attempt.status == status_filter)

    rows = query.order_by(Attempt.started_at.desc()).all()
    items = [
        AdminAttemptListItem(
            attempt_id=attempt.id,
            user_id=user.id,
            user_name=user.name,
            user_email=user.email,
            quiz_id=quiz.id,
            quiz_title=quiz.title,
            category=quiz.category,
            status=attempt.status,
            started_at=attempt.started_at,
            expires_at=attempt.expires_at,
            submitted_at=result.submitted_at if result else None,
            score=result.score if result else None,
            total_marks=result.total_marks if result else None,
            percentage=result.percentage if result else None,
            passed=result.passed if result else None,
            time_taken_seconds=result.time_taken_seconds if result else None,
        )
        for attempt, quiz, user, result in rows
    ]
    return AdminAttemptListResponse(items=items, total=len(items), search=search, status=status_filter)


@router.get("/attempts/{attempt_id}", response_model=StudentAttemptSubmitResponse)
def read_attempt_result(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> StudentAttemptSubmitResponse:
    attempt = db.get(Attempt, attempt_id)
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
    result = db.query(AttemptResult).filter(AttemptResult.attempt_id == attempt.id).first()
    if result is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Attempt has not been submitted yet")
    quiz = db.get(Quiz, attempt.quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return build_attempt_review_response(db, attempt, quiz, result)


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
    quiz = create_quiz(db, payload)
    if quiz.is_published:
        notify_active_students(
            db,
            title="New quiz published",
            message=f"{quiz.title} is now available in {quiz.category}.",
            category="QUIZ",
            action_url="/student/start-quiz",
        )
    return quiz


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
    was_published = quiz.is_published
    updated_quiz = update_quiz(db, quiz, payload)
    if not was_published and updated_quiz.is_published:
        notify_active_students(
            db,
            title="New quiz published",
            message=f"{updated_quiz.title} is now available in {updated_quiz.category}.",
            category="QUIZ",
            action_url="/student/start-quiz",
        )
    return updated_quiz


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
    was_published = quiz.is_published
    updated_quiz = update_quiz_publish_state(db, quiz, is_published=payload.is_published, status=payload.status)
    if not was_published and updated_quiz.is_published:
        notify_active_students(
            db,
            title="New quiz published",
            message=f"{updated_quiz.title} is now available in {updated_quiz.category}.",
            category="QUIZ",
            action_url="/student/start-quiz",
        )
    return updated_quiz


@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_quiz(
    quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)
) -> None:
    quiz = get_quiz_by_id(db, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    delete_quiz(db, quiz)


@router.get("/categories", response_model=CategoryListResponse)
def read_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    search: str | None = Query(default=None, min_length=1, max_length=100),
) -> CategoryListResponse:
    categories, total = list_categories(db, search=search)
    return CategoryListResponse(items=categories, total=total, search=search)


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def add_category(
    payload: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)
) -> Category:
    return create_category(db, payload)


@router.get("/categories/{category_id}", response_model=CategoryRead)
def read_category(
    category_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)
) -> Category:
    category = get_category_by_id(db, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.put("/categories/{category_id}", response_model=CategoryRead)
def edit_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Category:
    category = get_category_by_id(db, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return update_category(db, category, payload)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_category(
    category_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)
) -> None:
    category = get_category_by_id(db, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    delete_category(db, category)


@router.get("/quizzes/{quiz_id}/questions", response_model=QuestionListResponse)
def read_quiz_questions(
    quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)
) -> QuestionListResponse:
    questions, total = list_questions(db, quiz_id=quiz_id)
    return QuestionListResponse(items=questions, total=total, quiz_id=quiz_id)


@router.post("/quizzes/{quiz_id}/questions", response_model=QuestionRead, status_code=status.HTTP_201_CREATED)
def add_quiz_question(
    quiz_id: int,
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Question:
    if get_quiz_by_id(db, quiz_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    if payload.quiz_id != quiz_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question quiz_id must match the path quiz_id",
        )
    return create_question(db, payload)


@router.get("/questions/{question_id}", response_model=QuestionRead)
def read_question(
    question_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)
) -> Question:
    question = (
        db.query(Question)
        .options(selectinload(Question.options))
        .filter(Question.id == question_id)
        .first()
    )
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return question


@router.put("/questions/{question_id}", response_model=QuestionRead)
def edit_question(
    question_id: int,
    payload: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Question:
    question = get_question_by_id(db, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    if payload.quiz_id != question.quiz_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question quiz_id cannot be changed in this update",
        )
    return update_question(db, question, payload)


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_question(
    question_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)
) -> None:
    question = get_question_by_id(db, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    delete_question(db, question)
