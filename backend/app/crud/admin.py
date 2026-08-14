from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.constants import UserRole, UserStatus
from app.models.user import User


def list_users(
    db: Session,
    *,
    search: str | None = None,
    role: UserRole | None = None,
    status: UserStatus | None = None,
) -> tuple[list[User], int]:
    query = db.query(User)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(or_(User.name.ilike(search_term), User.email.ilike(search_term)))
    if role is not None:
        query = query.filter(User.role == role)
    if status is not None:
        query = query.filter(User.status == status)

    total = query.count()
    users = query.order_by(User.created_at.desc()).all()
    return users, total


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()


def update_user_status(db: Session, user: User, *, is_active: bool, status: UserStatus) -> User:
    user.is_active = is_active
    user.status = status
    db.commit()
    db.refresh(user)
    return user

