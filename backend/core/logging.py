"""Structured logging setup."""

from __future__ import annotations

import logging
import sys

from core.config import settings


def configure_logging() -> None:
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    fmt = (
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
        if not settings.DEBUG
        else "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s"
    )

    logging.basicConfig(
        level=level,
        format=fmt,
        datefmt="%Y-%m-%dT%H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Quiet noisy third-party loggers
    for noisy in ("httpx", "httpcore", "uvicorn.access"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
