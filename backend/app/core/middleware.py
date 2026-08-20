from collections import defaultdict, deque
from time import monotonic

from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._limited_paths = {
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
        }

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in self._limited_paths:
            client_host = request.client.host if request.client else "unknown"
            key = f"{client_host}:{request.url.path}"
            now = monotonic()
            window_start = now - 60
            recent_requests = self._requests[key]
            while recent_requests and recent_requests[0] < window_start:
                recent_requests.popleft()
            if len(recent_requests) >= settings.rate_limit_per_minute:
                return Response(
                    content='{"detail":"Too many requests. Please try again shortly."}',
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    media_type="application/json",
                )
            recent_requests.append(now)
        return await call_next(request)
