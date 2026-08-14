from datetime import datetime, timezone
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.crud.attempt import create_attempt, save_attempt_answers
from app.crud.attempt_result import upsert_attempt_result
from app.dependencies import get_db
from app.dependencies import require_student
from app.models.attempt import Attempt
from app.models.attempt_answer import AttemptAnswer
from app.models.option import Option
from app.models.question import Question
from app.models.attempt_result import AttemptResult
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.auth import UserRead
from app.schemas.student_quiz import (
    StudentDashboardAttemptPoint,
    StudentDashboardCategoryPerformance,
    StudentDashboardResponse,
    StudentCategoryLeaderboardItem,
    StudentAttemptQuestionResult,
    StudentAttemptHistoryItem,
    StudentAttemptHistoryResponse,
    StudentAttemptSubmitRequest,
    StudentAttemptSubmitResponse,
    StudentLeaderboardItem,
    StudentLeaderboardResponse,
    StudentQuizDetail,
    StudentQuizListItem,
    StudentQuizListResponse,
    StudentQuizStartResponse,
    StudentQuestionRead,
    StudentOptionRead,
)

router = APIRouter(prefix="/student", tags=["Student"])


def build_attempt_review_response(db: Session, attempt: Attempt, quiz: Quiz, result: AttemptResult) -> StudentAttemptSubmitResponse:
    questions = (
        db.query(Question)
        .options(selectinload(Question.options))
        .filter(Question.quiz_id == quiz.id)
        .order_by(Question.created_at.asc())
        .all()
    )
    answer_rows = db.query(AttemptAnswer).filter(AttemptAnswer.attempt_id == attempt.id).all()
    answers_by_question = {answer.question_id: answer.selected_option_id for answer in answer_rows}

    question_results: list[StudentAttemptQuestionResult] = []
    for question in questions:
        selected_option_id = answers_by_question.get(question.id)
        selected_option = next((option for option in question.options if option.id == selected_option_id), None)
        correct_option = next((option for option in question.options if option.is_correct), None)
        is_correct = bool(selected_option and selected_option.is_correct)
        question_results.append(
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

    return StudentAttemptSubmitResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        total_questions=len(questions),
        correct_count=result.correct_count,
        incorrect_count=result.incorrect_count,
        unanswered_count=result.unanswered_count,
        score=result.score,
        total_marks=result.total_marks,
        percentage=result.percentage,
        passing_score=quiz.passing_score,
        passed=result.passed,
        status=attempt.status,
        submitted_at=result.submitted_at,
        time_taken_seconds=result.time_taken_seconds,
        results=question_results,
    )


@router.get("/me", response_model=UserRead)
def read_student_profile(current_user: User = Depends(require_student)) -> User:
    return current_user


@router.get("/dashboard")
def student_dashboard(
    db: Session = Depends(get_db), current_user: User = Depends(require_student)
) -> StudentDashboardResponse:
    total_attempts = db.query(func.count(Attempt.id)).filter(Attempt.user_id == current_user.id).scalar() or 0

    attempt_rows = (
        db.query(Attempt, Quiz, AttemptResult)
        .join(Quiz, Quiz.id == Attempt.quiz_id)
        .outerjoin(AttemptResult, AttemptResult.attempt_id == Attempt.id)
        .filter(Attempt.user_id == current_user.id)
        .order_by(Attempt.started_at.desc())
        .all()
    )

    submitted_rows = [row for row in attempt_rows if row[2] is not None]
    completed_attempts = len(submitted_rows)
    passed_attempts = sum(1 for _, _, result in submitted_rows if result.passed)
    failed_attempts = completed_attempts - passed_attempts
    average_score = round(
        sum(result.percentage for _, _, result in submitted_rows) / completed_attempts, 2
    ) if completed_attempts else 0.0
    best_score = round(max((result.percentage for _, _, result in submitted_rows), default=0.0), 2)
    total_time_spent_seconds = sum(result.time_taken_seconds for _, _, result in submitted_rows)

    recent_attempts = [
        StudentAttemptHistoryItem(
            attempt_id=attempt.id,
            quiz_id=quiz.id,
            quiz_title=quiz.title,
            status=attempt.status,
            started_at=attempt.started_at,
            expires_at=attempt.expires_at,
            submitted_at=result.submitted_at if result else None,
            score=result.score if result else None,
            total_marks=result.total_marks if result else None,
            percentage=result.percentage if result else None,
            correct_count=result.correct_count if result else None,
            incorrect_count=result.incorrect_count if result else None,
            unanswered_count=result.unanswered_count if result else None,
            passed=result.passed if result else None,
            time_taken_seconds=result.time_taken_seconds if result else None,
        )
        for attempt, quiz, result in attempt_rows[:5]
    ]

    performance_points = [
        StudentDashboardAttemptPoint(
            attempt_id=attempt.id,
            quiz_title=quiz.title,
            submitted_at=result.submitted_at,
            percentage=result.percentage,
            passed=result.passed,
        )
        for attempt, quiz, result in reversed(submitted_rows[:6])
    ]

    category_bucket: dict[str, dict[str, float | int]] = {}
    for _, quiz, result in submitted_rows:
        bucket = category_bucket.setdefault(
            quiz.category,
            {"attempts": 0, "total_percentage": 0.0, "passed_attempts": 0},
        )
        bucket["attempts"] = int(bucket["attempts"]) + 1
        bucket["total_percentage"] = float(bucket["total_percentage"]) + float(result.percentage)
        bucket["passed_attempts"] = int(bucket["passed_attempts"]) + (1 if result.passed else 0)

    category_performance = [
        StudentDashboardCategoryPerformance(
            category=category,
            attempts=int(values["attempts"]),
            average_percentage=round(float(values["total_percentage"]) / int(values["attempts"]), 2),
            passed_attempts=int(values["passed_attempts"]),
        )
        for category, values in sorted(category_bucket.items(), key=lambda item: item[0].lower())
    ]

    return StudentDashboardResponse(
        total_attempts=total_attempts,
        completed_attempts=completed_attempts,
        passed_attempts=passed_attempts,
        failed_attempts=failed_attempts,
        average_score=average_score,
        best_score=best_score,
        total_time_spent_seconds=total_time_spent_seconds,
        recent_attempts=recent_attempts,
        performance_points=performance_points,
        category_performance=category_performance,
    )


@router.get("/leaderboard", response_model=StudentLeaderboardResponse)
def student_leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
    category: str | None = Query(default=None, min_length=1, max_length=100),
) -> StudentLeaderboardResponse:
    attempt_rows = (
        db.query(Attempt, AttemptResult, Quiz, User)
        .join(AttemptResult, AttemptResult.attempt_id == Attempt.id)
        .join(Quiz, Quiz.id == Attempt.quiz_id)
        .join(User, User.id == Attempt.user_id)
        .order_by(AttemptResult.submitted_at.desc())
        .all()
    )

    categories = sorted({quiz.category for _, _, quiz, _ in attempt_rows}, key=str.lower)
    selected_category = category if category and category in categories else (categories[0] if categories else None)

    overall_bucket: dict[int, dict[str, object]] = {}
    category_bucket: dict[int, dict[str, object]] = {}
    for attempt, result, quiz, user in attempt_rows:
        user_bucket = overall_bucket.setdefault(
            user.id,
            {
                "user_name": user.name,
                "user_email": user.email,
                "attempts": 0,
                "total_percentage": 0.0,
                "best_score": 0.0,
                "passed_attempts": 0,
                "total_time_spent_seconds": 0,
            },
        )
        user_bucket["attempts"] = int(user_bucket["attempts"]) + 1
        user_bucket["total_percentage"] = float(user_bucket["total_percentage"]) + float(result.percentage)
        user_bucket["best_score"] = max(float(user_bucket["best_score"]), float(result.percentage))
        user_bucket["passed_attempts"] = int(user_bucket["passed_attempts"]) + (1 if result.passed else 0)
        user_bucket["total_time_spent_seconds"] = int(user_bucket["total_time_spent_seconds"]) + int(
            result.time_taken_seconds
        )

        if selected_category and quiz.category == selected_category:
            cat_bucket = category_bucket.setdefault(
                user.id,
                {
                    "user_name": user.name,
                    "user_email": user.email,
                    "attempts": 0,
                    "total_percentage": 0.0,
                    "best_score": 0.0,
                    "passed_attempts": 0,
                    "total_time_spent_seconds": 0,
                },
            )
            cat_bucket["attempts"] = int(cat_bucket["attempts"]) + 1
            cat_bucket["total_percentage"] = float(cat_bucket["total_percentage"]) + float(result.percentage)
            cat_bucket["best_score"] = max(float(cat_bucket["best_score"]), float(result.percentage))
            cat_bucket["passed_attempts"] = int(cat_bucket["passed_attempts"]) + (1 if result.passed else 0)
            cat_bucket["total_time_spent_seconds"] = int(cat_bucket["total_time_spent_seconds"]) + int(
                result.time_taken_seconds
            )

    def rank_rows(rows: list[tuple[int, dict[str, object]]]) -> list[tuple[int, dict[str, object]]]:
        return sorted(
            rows,
            key=lambda item: (
                -float(item[1]["total_percentage"]) / max(1, int(item[1]["attempts"])),
                -int(item[1]["passed_attempts"]),
                -float(item[1]["best_score"]),
                int(item[1]["total_time_spent_seconds"]),
                str(item[1]["user_name"]).lower(),
            ),
        )

    overall_ranked = rank_rows(list(overall_bucket.items()))
    category_ranked = rank_rows(list(category_bucket.items()))

    overall = [
        StudentLeaderboardItem(
            rank=index,
            user_id=user_id,
            user_name=str(values["user_name"]),
            user_email=str(values["user_email"]),
            attempts=int(values["attempts"]),
            average_score=round(float(values["total_percentage"]) / int(values["attempts"]), 2),
            best_score=round(float(values["best_score"]), 2),
            passed_attempts=int(values["passed_attempts"]),
            total_time_spent_seconds=int(values["total_time_spent_seconds"]),
        )
        for index, (user_id, values) in enumerate(overall_ranked, start=1)
    ]

    category_leaderboard = [
        StudentCategoryLeaderboardItem(
            rank=index,
            user_id=user_id,
            user_name=str(values["user_name"]),
            user_email=str(values["user_email"]),
            category=selected_category or "",
            attempts=int(values["attempts"]),
            average_score=round(float(values["total_percentage"]) / int(values["attempts"]), 2),
            best_score=round(float(values["best_score"]), 2),
            passed_attempts=int(values["passed_attempts"]),
            total_time_spent_seconds=int(values["total_time_spent_seconds"]),
        )
        for index, (user_id, values) in enumerate(category_ranked, start=1)
    ]

    return StudentLeaderboardResponse(
        selected_category=selected_category,
        categories=categories,
        overall=overall,
        category_leaderboard=category_leaderboard,
    )


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


@router.get("/attempts", response_model=StudentAttemptHistoryResponse)
def list_attempt_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
) -> StudentAttemptHistoryResponse:
    attempts = (
        db.query(Attempt, Quiz, AttemptResult)
        .join(Quiz, Quiz.id == Attempt.quiz_id)
        .outerjoin(AttemptResult, AttemptResult.attempt_id == Attempt.id)
        .filter(Attempt.user_id == current_user.id)
        .order_by(Attempt.started_at.desc())
        .all()
    )
    items = [
        StudentAttemptHistoryItem(
            attempt_id=attempt.id,
            quiz_id=quiz.id,
            quiz_title=quiz.title,
            status=attempt.status,
            started_at=attempt.started_at,
            expires_at=attempt.expires_at,
            submitted_at=result.submitted_at if result else None,
            score=result.score if result else None,
            total_marks=result.total_marks if result else None,
            percentage=result.percentage if result else None,
            correct_count=result.correct_count if result else None,
            incorrect_count=result.incorrect_count if result else None,
            unanswered_count=result.unanswered_count if result else None,
            passed=result.passed if result else None,
            time_taken_seconds=result.time_taken_seconds if result else None,
        )
        for attempt, quiz, result in attempts
    ]
    return StudentAttemptHistoryResponse(items=items, total=len(items))


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
    result = upsert_attempt_result(
        db,
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        user_id=current_user.id,
        score=score,
        total_marks=total_marks,
        percentage=percentage,
        correct_count=correct_count,
        incorrect_count=incorrect_count,
        unanswered_count=unanswered_count,
        passed=passed,
        submitted_at=submitted_at,
        time_taken_seconds=time_taken_seconds,
    )

    return StudentAttemptSubmitResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        total_questions=len(questions),
        correct_count=result.correct_count,
        incorrect_count=result.incorrect_count,
        unanswered_count=result.unanswered_count,
        score=result.score,
        total_marks=result.total_marks,
        percentage=result.percentage,
        passing_score=quiz.passing_score,
        passed=result.passed,
        status=attempt.status,
        submitted_at=result.submitted_at,
        time_taken_seconds=result.time_taken_seconds,
        results=results,
    )


@router.get("/attempts/{attempt_id}", response_model=StudentAttemptSubmitResponse)
def read_attempt_review(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
) -> StudentAttemptSubmitResponse:
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id, Attempt.user_id == current_user.id).first()
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
    result = db.query(AttemptResult).filter(AttemptResult.attempt_id == attempt.id).first()
    if result is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Attempt has not been submitted yet")
    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id, Quiz.is_published.is_(True)).first()
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return build_attempt_review_response(db, attempt, quiz, result)
