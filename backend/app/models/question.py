from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    marks: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(50), nullable=False, default="Intermediate")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    options = relationship("Option", back_populates="question", cascade="all, delete-orphan")
