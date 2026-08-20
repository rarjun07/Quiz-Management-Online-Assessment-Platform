from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import UserRole, UserStatus
from app.core.security import hash_password, verify_password
from app.models.user import User


def ensure_initial_admin(db: Session) -> None:
    email = (settings.initial_admin_email or "").strip().lower()
    password = settings.initial_admin_password or ""
    if not email or not password:
        return

    admin = db.query(User).filter(User.email == email).first()
    if admin is None:
        db.add(
            User(
                name=settings.initial_admin_name,
                email=email,
                password_hash=hash_password(password),
                role=UserRole.admin,
                status=UserStatus.active,
                is_active=True,
            )
        )
        db.commit()
        return

    changed = False
    if admin.role != UserRole.admin:
        admin.role = UserRole.admin
        changed = True
    if admin.status != UserStatus.active:
        admin.status = UserStatus.active
        changed = True
    if not admin.is_active:
        admin.is_active = True
        changed = True
    if settings.initial_admin_sync_password and not verify_password(password, admin.password_hash):
        admin.password_hash = hash_password(password)
        changed = True

    if changed:
        db.commit()
