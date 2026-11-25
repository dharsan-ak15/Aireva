"""
Aireva Backend – FastAPI entry point.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from core.logging import configure_logging

configure_logging()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Check API connectivity on startup."""
    logger.info("Aireva backend starting up …")

    # Lazy import to avoid circular imports at module level
    from services.openaq_client import OpenAQClient
    from services.gemini_service import GeminiService

    openaq_ok = await OpenAQClient().health_check()
    gemini_ok = GeminiService().is_configured()

    app.state.openaq_ok = openaq_ok
    app.state.gemini_ok = gemini_ok
    app.state.firebase_ok = _check_firebase()

    logger.info(
        "Service connectivity – OpenAQ: %s | Gemini: %s | Firebase: %s",
        openaq_ok, gemini_ok, app.state.firebase_ok,
    )
    yield
    logger.info("Aireva backend shutting down.")


def _check_firebase() -> bool:
    if not settings.FIREBASE_CREDENTIALS_JSON:
        return False
    try:
        import firebase_admin  # noqa: F401
        return True
    except Exception:
        return False


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Aireva API",
    version="1.0.0",
    description="Urban Air Quality Assistant backend",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------

@app.exception_handler(422)
async def validation_exception_handler(request: Request, exc: Exception):
    logger.warning("Validation error on %s: %s", request.url, exc)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": str(exc), "error": "Validation failed"},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

from api.routes import aqi, recommendations, ai, indoor, simulator, users  # noqa: E402

app.include_router(aqi.router,             prefix="/api/aqi",             tags=["AQI"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(ai.router,              prefix="/api/ai",              tags=["AI"])
app.include_router(indoor.router,          prefix="/api/indoor",          tags=["Indoor"])
app.include_router(simulator.router,       prefix="/api/simulator",       tags=["Simulator"])
app.include_router(users.router,           prefix="/api/users",           tags=["Users"])

# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Health"])
async def health(request: Request):
    return {
        "status": "ok",
        "version": "1.0.0",
        "services": {
            "openaq":   getattr(request.app.state, "openaq_ok",  False),
            "gemini":   getattr(request.app.state, "gemini_ok",  False),
            "firebase": getattr(request.app.state, "firebase_ok", False),
        },
    }
