"""User profile service – Firebase Firestore with local JSON fallback."""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Optional

from models.user import UserProfile

logger = logging.getLogger(__name__)

_LOCAL_DIR = Path(__file__).parent.parent / "data" / "profiles"
_LOCAL_DIR.mkdir(parents=True, exist_ok=True)

_firebase_available = False
_db = None


def _init_firebase() -> bool:
    global _firebase_available, _db
    try:
        from core.config import settings
        if not settings.FIREBASE_CREDENTIALS_JSON:
            return False
        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_JSON)
            firebase_admin.initialize_app(cred)
        _db = firestore.client()
        _firebase_available = True
        logger.info("Firebase Firestore initialised (cloud sync ACTIVE)")
        return True
    except Exception as exc:
        logger.info("Firebase unavailable (%s) – using local JSON fallback", exc)
        return False


_init_firebase()


async def save_profile(profile: UserProfile) -> UserProfile:
    if not profile.user_id:
        import uuid
        profile.user_id = str(uuid.uuid4())

    if _firebase_available and _db:
        try:
            _db.collection("profiles").document(profile.user_id).set(
                profile.model_dump()
            )
            logger.info("Profile %s saved to Firestore", profile.user_id)
            return profile
        except Exception as exc:
            logger.warning("Firestore write failed: %s – falling back to local", exc)

    # Local JSON fallback
    path = _LOCAL_DIR / f"{profile.user_id}.json"
    path.write_text(profile.model_dump_json(indent=2), encoding="utf-8")
    logger.info("Profile %s saved locally (cloud sync INACTIVE)", profile.user_id)
    return profile


async def get_profile(user_id: str) -> Optional[UserProfile]:
    if _firebase_available and _db:
        try:
            doc = _db.collection("profiles").document(user_id).get()
            if doc.exists:
                return UserProfile(**doc.to_dict())
        except Exception as exc:
            logger.warning("Firestore read failed: %s – falling back to local", exc)

    path = _LOCAL_DIR / f"{user_id}.json"
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        return UserProfile(**data)

    return None
