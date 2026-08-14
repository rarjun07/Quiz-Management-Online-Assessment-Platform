from datetime import datetime

from sqlalchemy.orm import Session

from app.models.attempt_result import AttemptResult


def upsert_attempt_result(
    db: Session,
    *,
    attempt_id: int,
    quiz_id: int,
    user_id: int,
    score: int,
    total_marks: int,
    percentage: float,
    correct_count: int,
    incorrect_count: int,
    unanswered_count: int,
    passed: bool,
    submitted_at: datetime,
    time_taken_seconds: int,
) -> AttemptResult:
    result = db.query(AttemptResult).filter(AttemptResult.attempt_id == attempt_id).first()
    if result is None:
        result = AttemptResult(
            attempt_id=attempt_id,
            quiz_id=quiz_id,
            user_id=user_id,
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
        db.add(result)
    else:
        result.quiz_id = quiz_id
        result.user_id = user_id
        result.score = score
        result.total_marks = total_marks
        result.percentage = percentage
        result.correct_count = correct_count
        result.incorrect_count = incorrect_count
        result.unanswered_count = unanswered_count
        result.passed = passed
        result.submitted_at = submitted_at
        result.time_taken_seconds = time_taken_seconds
    db.commit()
    db.refresh(result)
    return result
