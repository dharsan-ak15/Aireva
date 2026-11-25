"""User profile domain model."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class AgeCategoryEnum(str, Enum):
    CHILD = "child"
    ADULT = "adult"
    SENIOR = "senior"


class BudgetEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class CommuteTypeEnum(str, Enum):
    WALKING = "walking"
    CYCLING = "cycling"
    MOTORCYCLE = "motorcycle"
    CAR = "car"
    PUBLIC_TRANSPORT = "public_transport"
    AUTO_RICKSHAW = "auto_rickshaw"
    WORK_FROM_HOME = "work_from_home"


class OccupationTypeEnum(str, Enum):
    INDOOR = "indoor"
    OUTDOOR = "outdoor"
    MIXED = "mixed"
    STUDENT = "student"
    RETIRED = "retired"


class CookingFuelEnum(str, Enum):
    LPG = "lpg"
    BIOMASS = "biomass"
    KEROSENE = "kerosene"
    ELECTRIC = "electric"
    PIPED_GAS = "piped_gas"


class UserProfile(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: Optional[str] = None
    name: Optional[str] = None

    # Demographics
    age_category: AgeCategoryEnum = AgeCategoryEnum.ADULT
    has_young_children: bool = False
    has_elderly: bool = False

    # Health
    has_respiratory_conditions: bool = False   # asthma, COPD, etc.
    has_cardiovascular_conditions: bool = False

    # Lifestyle
    commute_type: CommuteTypeEnum = CommuteTypeEnum.PUBLIC_TRANSPORT
    occupation_type: OccupationTypeEnum = OccupationTypeEnum.INDOOR
    exercises_outdoors: bool = False

    # Household
    city: str = ""
    cooking_fuel: CookingFuelEnum = CookingFuelEnum.LPG
    has_air_purifier: bool = False
    has_exhaust_fan_kitchen: bool = True
    uses_incense: bool = False
    uses_mosquito_coils: bool = False
    has_children_school_schedule: bool = False

    # Financial
    budget: BudgetEnum = BudgetEnum.MEDIUM
