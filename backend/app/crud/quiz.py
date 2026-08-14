from sqlalchemy.orm import Session

from app.models.quiz import Quiz
from app.schemas.quiz import QuizCreate, QuizUpdate


def list_quizzes(db: Session, *, search: str | None = None, status: str | None = None) -> tuple[list[Quiz], int]:
    query = db.query(Quiz)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(Quiz.title.ilike(term))
    if status:
        query = query.filter(Quiz.status == status)

    total = query.count()
    quizzes = query.order_by(Quiz.created_at.desc()).all()
    return quizzes, total


def get_quiz_by_id(db: Session, quiz_id: int) -> Quiz | None:
    return db.get(Quiz, quiz_id)


def create_quiz(db: Session, quiz_in: QuizCreate) -> Quiz:
    quiz = Quiz(
        title=quiz_in.title,
        description=quiz_in.description,
        category=quiz_in.category,
        difficulty=quiz_in.difficulty,
        duration=quiz_in.duration,
        passing_score=quiz_in.passing_score,
        max_attempts=quiz_in.max_attempts,
        status=quiz_in.status,
        is_published=quiz_in.status == "PUBLISHED",
        thumbnail_url=quiz_in.thumbnail_url,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


def update_quiz(db: Session, quiz: Quiz, quiz_in: QuizUpdate) -> Quiz:
    quiz.title = quiz_in.title
    quiz.description = quiz_in.description
    quiz.category = quiz_in.category
    quiz.difficulty = quiz_in.difficulty
    quiz.duration = quiz_in.duration
    quiz.passing_score = quiz_in.passing_score
    quiz.max_attempts = quiz_in.max_attempts
    quiz.status = quiz_in.status
    quiz.is_published = quiz_in.status == "PUBLISHED"
    quiz.thumbnail_url = quiz_in.thumbnail_url
    db.commit()
    db.refresh(quiz)
    return quiz


def delete_quiz(db: Session, quiz: Quiz) -> None:
    db.delete(quiz)
    db.commit()


def update_quiz_publish_state(db: Session, quiz: Quiz, *, is_published: bool, status: str) -> Quiz:
    quiz.is_published = is_published
    quiz.status = status
    db.commit()
    db.refresh(quiz)
    return quiz
