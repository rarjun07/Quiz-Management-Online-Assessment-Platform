from email.message import EmailMessage
import smtplib

from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import UserRole
from app.core.security import create_access_token, create_password_reset_token, verify_password
from app.crud.auth import create_user, get_user_by_email, update_user_password
from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import ForgotPasswordRequest, PasswordResetResponse, ResetPasswordRequest, Token, UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["Authentication"])


def send_password_reset_email(email: str, reset_token: str) -> None:
    if not settings.smtp_host or not settings.smtp_from_email:
        return

    reset_url = f"{settings.frontend_url.rstrip('/')}/login"
    message = EmailMessage()
    message["Subject"] = "QuizFlow password reset"
    message["From"] = settings.smtp_from_email
    message["To"] = email
    message.set_content(
        "Use this token to reset your QuizFlow password:\n\n"
        f"{reset_token}\n\n"
        f"Open {reset_url}, choose Forgot password, then paste the token."
    )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        if settings.smtp_username and settings.smtp_password:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)) -> User:
    existing_user = get_user_by_email(db, user_in.email.lower())
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    student_user = user_in.model_copy(update={"role": UserRole.student})
    return create_user(db, student_user)


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    user = get_user_by_email(db, form_data.username.lower())
    if user is None or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )
    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)) -> dict[str, str]:
    return {"message": f"User {current_user.email} logged out successfully"}


@router.post("/forgot-password", response_model=PasswordResetResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> PasswordResetResponse:
    user = get_user_by_email(db, payload.email.lower())
    reset_token = create_password_reset_token(str(user.id)) if user and user.is_active else None
    email_configured = bool(settings.smtp_host and settings.smtp_from_email)
    if user and reset_token and email_configured:
        send_password_reset_email(user.email, reset_token)
    visible_reset_token = reset_token if reset_token and (settings.expose_password_reset_token or not email_configured) else None
    return PasswordResetResponse(
        message=(
            "Use the reset token below to set a new password."
            if visible_reset_token
            else "If this email is registered, password reset instructions will be sent."
        ),
        reset_token=visible_reset_token,
    )


@router.post("/reset-password", response_model=PasswordResetResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> PasswordResetResponse:
    try:
        token_payload = jwt.decode(payload.token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token") from exc

    if token_payload.get("purpose") != "password_reset" or token_payload.get("sub") is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user = db.get(User, int(token_payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    update_user_password(db, user, payload.password)
    return PasswordResetResponse(message="Password reset successfully.")


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("/role")
def read_current_role(current_user: User = Depends(get_current_user)) -> dict[str, str]:
    return {"role": current_user.role.value, "status": current_user.status.value}
