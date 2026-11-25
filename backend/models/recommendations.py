"""Recommendation domain model."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PriorityEnum(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class CategoryEnum(str, Enum):
    OUTDOOR_ACTIVITY = "outdoor_activity"
    COMMUTE = "commute"
    INDOOR = "indoor"
    HEALTH = "health"
    CHILDREN = "children"
    OCCUPATIONAL = "occupational"
    GENERAL = "general"


class TimeOfDayEnum(str, Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"
    NIGHT = "night"
    ALL_DAY = "all_day"


class Recommendation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    action: str
    reason: str
    benefit: str
    priority: PriorityEnum
    confidence: float = 1.0           # 0.0 – 1.0
    time_of_day: Optional[TimeOfDayEnum] = None
    category: CategoryEnum = CategoryEnum.GENERAL
    alternative_action: Optional[str] = None
    influenced_by: list[str] = []     # e.g. ["has_young_children", "aqi_category"]


class IndoorChecklistItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    action: str
    reason: str
    priority: PriorityEnum
    cost: str = "low"                 # "low" | "medium" | "high"
    category: CategoryEnum = CategoryEnum.INDOOR
    frequency: Optional[str] = None  # "daily", "weekly", "monthly"
