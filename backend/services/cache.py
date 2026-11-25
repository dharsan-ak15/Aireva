"""Simple in-memory cache backed by cachetools."""

from __future__ import annotations

import time
from typing import Any, Optional

from cachetools import TTLCache

from core.config import settings

_cache: TTLCache = TTLCache(maxsize=512, ttl=settings.CACHE_TTL_SECONDS)


def get(key: str) -> Optional[Any]:
    return _cache.get(key)


def set(key: str, value: Any) -> None:
    _cache[key] = value


def delete(key: str) -> None:
    _cache.pop(key, None)


def clear() -> None:
    _cache.clear()
