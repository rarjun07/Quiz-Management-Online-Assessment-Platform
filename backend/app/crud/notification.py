from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.constants import UserRole, UserStatus
from app.models.notification import Notification
from app.models.user import User


def create_notification(
    db: Session,
    *,
    user_id: int,
    title: str,
    message: str,
    category: str = "SYSTEM",
    action_url: str | None = None,
    commit: bool = True,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        category=category,
        action_url=action_url,
    )
    db.add(notification)
    if commit:
        db.commit()
        db.refresh(notification)
    return notification


def notify_active_students(
    db: Session,
    *,
    title: str,
    message: str,
    category: str = "SYSTEM",
    action_url: str | None = None,
) -> int:
    student_ids = [
        user_id
        for (user_id,) in (
            db.query(User.id)
            .filter(User.role == UserRole.student, User.status == UserStatus.active, User.is_active.is_(True))
            .all()
        )
    ]
    for user_id in student_ids:
        create_notification(
            db,
            user_id=user_id,
            title=title,
            message=message,
            category=category,
            action_url=action_url,
            commit=False,
        )
    if student_ids:
        db.commit()
    return len(student_ids)


def list_notifications(
    db: Session,
    *,
    user_id: int,
    unread_only: bool = False,
    limit: int = 20,
) -> tuple[list[Notification], int, int]:
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))

    total = query.count()
    unread_count = (
        db.query(func.count(Notification.id))
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .scalar()
        or 0
    )
    items = query.order_by(Notification.created_at.desc(), Notification.id.desc()).limit(limit).all()
    return items, total, unread_count


def mark_notification_read(db: Session, *, notification: Notification) -> Notification:
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)
    return notification


def mark_all_notifications_read(db: Session, *, user_id: int) -> int:
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .all()
    )
    read_at = datetime.now(timezone.utc)
    for notification in notifications:
        notification.is_read = True
        notification.read_at = read_at
    if notifications:
        db.commit()
    return len(notifications)
