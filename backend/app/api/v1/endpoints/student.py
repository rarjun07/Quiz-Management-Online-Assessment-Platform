from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.crud.attempt import create_attempt
from app.dependencies import get_db
from app.dependencies import require_student
from app.models.question import Question
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.auth import UserRead
from app.schemas.student_quiz import (
    StudentQuizDetail,
    StudentQuizListItem,
    StudentQuizListResponse,
    StudentQuizStartResponse,
    StudentQuestionRead,
    StudentOptionRead,
)

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


@router.get("/quizzes", response_model=StudentQuizListResponse)
def list_available_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
    search: str | None = Query(default=None, min_length=1, max_length=100),
) -> StudentQuizListResponse:
    query = db.query(Quiz).filter(Quiz.is_published.is_(True))
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(Quiz.title.ilike(term))

    total = query.count()
    quizzes = query.order_by(Quiz.created_at.desc()).all()
    items: list[StudentQuizListItem] = []
    for quiz in quizzes:
        # Count questions without exposing answers.
        questions_count = db.query(func.count(Question.id)).filter(Question.quiz_id == quiz.id).scalar() or 0
        items.append(
            StudentQuizListItem(
                id=quiz.id,
                title=quiz.title,
                description=quiz.description,
                category=quiz.category,
                difficulty=quiz.difficulty,
                duration=quiz.duration,
                passing_score=quiz.passing_score,
                max_attempts=quiz.max_attempts,
                status=quiz.status,
                is_published=quiz.is_published,
                questions_count=questions_count,
            )
        )
    return StudentQuizListResponse(items=items, total=total, search=search)


@router.get("/quizzes/{quiz_id}", response_model=StudentQuizDetail)
def read_available_quiz(
    quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_student)
) -> StudentQuizDetail:
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.is_published.is_(True)).first()
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    questions = (
        db.query(Question)
        .options(selectinload(Question.options))
        .filter(Question.quiz_id == quiz.id)
        .order_by(Question.created_at.asc())
        .all()
    )
    question_items = [
        StudentQuestionRead(
            id=question.id,
            question_text=question.question_text,
            marks=question.marks,
            explanation=question.explanation,
            difficulty=question.difficulty,
            options=[
                StudentOptionRead(id=option.id, option_text=option.option_text)
                for option in question.options
            ],
        )
        for question in questions
    ]
    return StudentQuizDetail(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        category=quiz.category,
        difficulty=quiz.difficulty,
        duration=quiz.duration,
        passing_score=quiz.passing_score,
        max_attempts=quiz.max_attempts,
        status=quiz.status,
        is_published=quiz.is_published,
        questions_count=len(question_items),
        questions=question_items,
    )


@router.post("/quizzes/{quiz_id}/start", response_model=StudentQuizStartResponse)
def start_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
) -> StudentQuizStartResponse:
    quiz = db.get(Quiz, quiz_id)
    if quiz is None or not quiz.is_published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    attempt = create_attempt(db, quiz, current_user)
    question_count = db.query(func.count(Question.id)).filter(Question.quiz_id == quiz.id).scalar() or 0
    return StudentQuizStartResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        started_at=attempt.started_at,
        expires_at=attempt.expires_at,
        duration=quiz.duration,
        question_count=question_count,
    )
