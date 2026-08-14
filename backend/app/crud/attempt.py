from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.attempt import Attempt
from app.models.quiz import Quiz
from app.models.user import User


def create_attempt(db: Session, quiz: Quiz, user: User) -> Attempt:
    started_at = datetime.now(timezone.utc)
    attempt = Attempt(
        quiz_id=quiz.id,
        user_id=user.id,
        status="IN_PROGRESS",
        started_at=started_at,
        expires_at=started_at + timedelta(minutes=quiz.duration),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def save_attempt_answers(db: Session, attempt_id: int, answer_rows: list[dict[str, int | None]]) -> None:
    from app.models.attempt_answer import AttemptAnswer

    for answer_row in answer_rows:
        db.add(
            AttemptAnswer(
                attempt_id=attempt_id,
                question_id=int(answer_row["question_id"]),
                selected_option_id=answer_row.get("selected_option_id"),
            )
        )
