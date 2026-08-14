from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from app.models.option import Option
from app.models.question import Question
from app.schemas.question import QuestionCreate, QuestionUpdate


def _replace_options(db: Session, question: Question, options_payload):
    question.options.clear()
    for option_payload in options_payload:
        question.options.append(
            Option(option_text=option_payload.option_text, is_correct=option_payload.is_correct)
        )
    db.flush()


def list_questions(db: Session, *, quiz_id: int | None = None) -> tuple[list[Question], int]:
    query = db.query(Question).options(selectinload(Question.options))
    if quiz_id is not None:
        query = query.filter(Question.quiz_id == quiz_id)
    total = query.count()
    items = query.order_by(Question.created_at.desc()).all()
    return items, total


def get_question_by_id(db: Session, question_id: int) -> Question | None:
    return (
        db.query(Question)
        .options(selectinload(Question.options))
        .filter(Question.id == question_id)
        .first()
    )


def create_question(db: Session, payload: QuestionCreate) -> Question:
    question = Question(
        quiz_id=payload.quiz_id,
        question_text=payload.question_text,
        marks=payload.marks,
        explanation=payload.explanation,
        difficulty=payload.difficulty,
    )
    db.add(question)
    db.flush()
    _replace_options(db, question, payload.options)
    db.commit()
    db.refresh(question)
    return question


def update_question(db: Session, question: Question, payload: QuestionUpdate) -> Question:
    question.quiz_id = payload.quiz_id
    question.question_text = payload.question_text
    question.marks = payload.marks
    question.explanation = payload.explanation
    question.difficulty = payload.difficulty
    _replace_options(db, question, payload.options)
    db.commit()
    db.refresh(question)
    return question


def delete_question(db: Session, question: Question) -> None:
    db.delete(question)
    db.commit()
