from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


@pytest.fixture()
def seeded_client(tmp_path):
    db_path = tmp_path / "day13.sqlite3"
    os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{db_path}"
    os.environ["SECRET_KEY"] = "day13-test-secret"

    import app.main as main
    from app.core.constants import UserRole, UserStatus
    from app.core.security import hash_password
    from app.db.session import Base, SessionLocal, engine
    from app.models.attempt import Attempt
    from app.models.attempt_answer import AttemptAnswer
    from app.models.attempt_result import AttemptResult
    from app.models.category import Category
    from app.models.option import Option
    from app.models.question import Question
    from app.models.quiz import Quiz
    from app.models.user import User

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    now = datetime.now(timezone.utc)

    admin = User(
        name="Admin User",
        email="admin@example.com",
        password_hash=hash_password("admin12345"),
        role=UserRole.admin,
        status=UserStatus.active,
        is_active=True,
    )
    student = User(
        name="Student User",
        email="student1@example.com",
        password_hash=hash_password("student12345"),
        role=UserRole.student,
        status=UserStatus.active,
        is_active=True,
    )
    category = Category(name="Python", description="Python category")
    quiz = Quiz(
        title="Python Basics",
        description="Foundations quiz",
        category="Python",
        difficulty="Beginner",
        duration=20,
        passing_score=60,
        max_attempts=2,
        status="PUBLISHED",
        is_published=True,
    )
    db.add_all([admin, student, category, quiz])
    db.commit()
    db.refresh(quiz)

    question = Question(
        quiz_id=quiz.id,
        question_text="What does Python emphasize?",
        marks=1,
        explanation="Python emphasizes readability.",
        difficulty="Beginner",
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    correct_option = Option(question_id=question.id, option_text="Readability", is_correct=True)
    wrong_option_1 = Option(question_id=question.id, option_text="Assembly-level control", is_correct=False)
    wrong_option_2 = Option(question_id=question.id, option_text="Manual memory management", is_correct=False)
    wrong_option_3 = Option(question_id=question.id, option_text="No whitespace", is_correct=False)
    db.add_all([correct_option, wrong_option_1, wrong_option_2, wrong_option_3])
    db.commit()
    db.refresh(correct_option)

    attempt = Attempt(
        quiz_id=quiz.id,
        user_id=student.id,
        status="SUBMITTED",
        started_at=now - timedelta(minutes=5),
        expires_at=now + timedelta(minutes=15),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    db.add(
        AttemptAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            selected_option_id=correct_option.id,
        )
    )
    db.add(
        AttemptResult(
            attempt_id=attempt.id,
            quiz_id=quiz.id,
            user_id=student.id,
            score=1,
            total_marks=1,
            percentage=100.0,
            correct_count=1,
            incorrect_count=0,
            unanswered_count=0,
            passed=True,
            submitted_at=now,
            time_taken_seconds=300,
        )
    )
    db.commit()

    seed_data = {
        "admin_email": "admin@example.com",
        "admin_password": "admin12345",
        "student_email": "student1@example.com",
        "student_password": "student12345",
        "quiz_id": quiz.id,
        "question_id": question.id,
        "correct_option_id": correct_option.id,
    }
    db.close()

    main.app.state.seeded = seed_data

    with TestClient(main.app) as client:
        yield client
