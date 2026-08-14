from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.crud.attempt import create_attempt, save_attempt_answers
from app.dependencies import get_db
from app.dependencies import require_student
from app.models.attempt import Attempt
from app.models.attempt_answer import AttemptAnswer
from app.models.option import Option
from app.models.question import Question
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.auth import UserRead
from app.schemas.student_quiz import (
    StudentAttemptQuestionResult,
    StudentAttemptSubmitRequest,
    StudentAttemptSubmitResponse,
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


@router.post("/attempts/{attempt_id}/submit", response_model=StudentAttemptSubmitResponse)
def submit_quiz_attempt(
    attempt_id: int,
    payload: StudentAttemptSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
) -> StudentAttemptSubmitResponse:
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id, Attempt.user_id == current_user.id).first()
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
    if attempt.status != "IN_PROGRESS":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Attempt has already been submitted")

    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id, Quiz.is_published.is_(True)).first()
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    questions = (
        db.query(Question)
        .options(selectinload(Question.options))
        .filter(Question.quiz_id == quiz.id)
        .order_by(Question.created_at.asc())
        .all()
    )
    if not questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz has no questions")

    question_map = {question.id: question for question in questions}
    answers_by_question = {
        answer.question_id: answer.selected_option_id for answer in payload.answers if answer.question_id in question_map
    }
    submit_rows = [
        {"question_id": question.id, "selected_option_id": answers_by_question.get(question.id)}
        for question in questions
    ]
    db.query(AttemptAnswer).filter(AttemptAnswer.attempt_id == attempt.id).delete(synchronize_session=False)
    save_attempt_answers(db, attempt.id, submit_rows)

    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0
    score = 0
    total_marks = sum(question.marks for question in questions)
    results: list[StudentAttemptQuestionResult] = []

    submitted_at = datetime.now(timezone.utc)
    time_taken_seconds = max(0, int((submitted_at - attempt.started_at).total_seconds()))

    for question in questions:
        selected_option_id = answers_by_question.get(question.id)
        selected_option = next((option for option in question.options if option.id == selected_option_id), None)
        correct_option = next((option for option in question.options if option.is_correct), None)
        is_correct = bool(selected_option and selected_option.is_correct)
        if selected_option_id is None:
            unanswered_count += 1
        elif is_correct:
            correct_count += 1
            score += question.marks
        else:
            incorrect_count += 1

        results.append(
            StudentAttemptQuestionResult(
                question_id=question.id,
                question_text=question.question_text,
                selected_option_id=selected_option.id if selected_option else selected_option_id,
                selected_option_text=selected_option.option_text if selected_option else None,
                correct_option_id=correct_option.id if correct_option else None,
                correct_option_text=correct_option.option_text if correct_option else None,
                marks=question.marks,
                marks_awarded=question.marks if is_correct else 0,
                is_correct=is_correct,
                explanation=question.explanation,
            )
        )

    percentage = round((score / total_marks) * 100, 2) if total_marks else 0.0
    passed = percentage >= quiz.passing_score
    attempt.status = "SUBMITTED"
    db.commit()

    return StudentAttemptSubmitResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        total_questions=len(questions),
        correct_count=correct_count,
        incorrect_count=incorrect_count,
        unanswered_count=unanswered_count,
        score=score,
        total_marks=total_marks,
        percentage=percentage,
        passing_score=quiz.passing_score,
        passed=passed,
        status=attempt.status,
        submitted_at=submitted_at,
        time_taken_seconds=time_taken_seconds,
        results=results,
    )
