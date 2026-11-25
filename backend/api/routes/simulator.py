"""What-If lifestyle simulator endpoints."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from fastapi import APIRouter

from models.user import CommuteTypeEnum, UserProfile

router = APIRouter()

# Approximate tailpipe CO2 emission factors (kg CO2 per passenger-km)
# Clearly labelled as standard estimates, not measured personal emissions.
CO2_FACTORS_KG_PER_KM: dict[str, float] = {
    "walking": 0.0,
    "cycling": 0.0,
    "motorcycle": 0.08,
    "car": 0.17,
    "public_transport": 0.04,
    "auto_rickshaw": 0.11,
    "work_from_home": 0.0,
}

AVG_URBAN_SPEED_KMH = 25.0


class RoutineScenarioInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = "scenario"
    name: str = "Routine"
    description: str = ""
    commute_method: CommuteTypeEnum = CommuteTypeEnum.PUBLIC_TRANSPORT
    commute_duration_minutes: int = Field(default=30, ge=0, le=300)
    exercises_outdoors: bool = False
    ventilation_timing: str = "avoid_peak"


class SimulatorCompareRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    current: RoutineScenarioInput
    alternative: RoutineScenarioInput
    profile: Optional[UserProfile] = None


class ScenarioOutput(BaseModel):
    id: str
    name: str
    description: str
    commute_method: str
    commute_duration_minutes: int
    exercises_outdoors: bool
    ventilation_timing: str
    estimated_co2_kg_per_day: Optional[float] = None
    estimated_exposure_reduction: str
    convenience_score: int
    cost_difference: str


class SimulatorCompareResponse(BaseModel):
    current_scenario: ScenarioOutput
    alternative_scenario: ScenarioOutput
    co2_difference_kg_per_day: Optional[float] = None
    exposure_comparison: str
    cost_comparison: str
    environmental_impact: str
    disclaimer: str


def _estimate_co2(method: str, duration_min: int) -> Optional[float]:
    factor = CO2_FACTORS_KG_PER_KM.get(method)
    if factor is None or duration_min <= 0:
        return 0.0 if factor == 0.0 else None
    round_trip_km = (duration_min / 60.0) * AVG_URBAN_SPEED_KMH * 2.0
    return round(factor * round_trip_km, 2)


def _convenience_score(method: str) -> int:
    scores = {
        "work_from_home": 9,
        "car": 8,
        "motorcycle": 7,
        "auto_rickshaw": 7,
        "public_transport": 6,
        "cycling": 5,
        "walking": 5,
    }
    return scores.get(method, 6)


def _exposure_note(method: str, exercises_outdoors: bool, vent: str) -> str:
    open_air = method in ("walking", "cycling", "motorcycle", "auto_rickshaw")
    parts = []
    if method == "work_from_home":
        parts.append("Minimal commute exposure")
    elif open_air:
        parts.append("Direct roadside pollutant exposure during commute")
    else:
        parts.append("Lower roadside exposure in enclosed transit")

    if exercises_outdoors:
        parts.append("higher inhalation during outdoor exercise")
    else:
        parts.append("indoor exercise avoids ambient PM2.5 spikes")

    if vent == "avoid_peak":
        parts.append("timed ventilation avoids rush-hour peaks")
    return "; ".join(parts)


@router.post("/compare", response_model=SimulatorCompareResponse)
async def compare_routines(payload: SimulatorCompareRequest):
    """Compare current and alternative lifestyle routines."""
    cur = payload.current
    alt = payload.alternative

    cur_co2 = _estimate_co2(cur.commute_method.value, cur.commute_duration_minutes)
    alt_co2 = _estimate_co2(alt.commute_method.value, alt.commute_duration_minutes)

    co2_diff: Optional[float] = None
    if cur_co2 is not None and alt_co2 is not None:
        co2_diff = round(cur_co2 - alt_co2, 2)

    cur_out = ScenarioOutput(
        id=cur.id,
        name=cur.name,
        description=cur.description or f"Commute via {cur.commute_method.value.replace('_', ' ')}",
        commute_method=cur.commute_method.value,
        commute_duration_minutes=cur.commute_duration_minutes,
        exercises_outdoors=cur.exercises_outdoors,
        ventilation_timing=cur.ventilation_timing,
        estimated_co2_kg_per_day=cur_co2,
        estimated_exposure_reduction=_exposure_note(
            cur.commute_method.value, cur.exercises_outdoors, cur.ventilation_timing
        ),
        convenience_score=_convenience_score(cur.commute_method.value),
        cost_difference="Baseline",
    )

    alt_out = ScenarioOutput(
        id=alt.id,
        name=alt.name,
        description=alt.description or f"Commute via {alt.commute_method.value.replace('_', ' ')}",
        commute_method=alt.commute_method.value,
        commute_duration_minutes=alt.commute_duration_minutes,
        exercises_outdoors=alt.exercises_outdoors,
        ventilation_timing=alt.ventilation_timing,
        estimated_co2_kg_per_day=alt_co2,
        estimated_exposure_reduction=_exposure_note(
            alt.commute_method.value, alt.exercises_outdoors, alt.ventilation_timing
        ),
        convenience_score=_convenience_score(alt.commute_method.value),
        cost_difference=(
            "Typically lower fuel/parking cost"
            if alt.commute_method in (CommuteTypeEnum.PUBLIC_TRANSPORT, CommuteTypeEnum.CYCLING, CommuteTypeEnum.WALKING, CommuteTypeEnum.WORK_FROM_HOME)
            else "Similar or higher depending on distance"
        ),
    )

    if co2_diff is not None and co2_diff > 0:
        env_text = (
            f"Switching could reduce estimated transport emissions by ~{co2_diff:.2f} kg CO2/day "
            f"(~{co2_diff * 22:.1f} kg/month over 22 commute days)."
        )
    elif co2_diff is not None and co2_diff < 0:
        env_text = f"The alternative increases estimated transport CO2 by ~{abs(co2_diff):.2f} kg/day."
    else:
        env_text = "Estimated transport CO2 emissions are similar between both routines."

    return SimulatorCompareResponse(
        current_scenario=cur_out,
        alternative_scenario=alt_out,
        co2_difference_kg_per_day=co2_diff,
        exposure_comparison=(
            f"Current: {cur_out.estimated_exposure_reduction}. "
            f"Alternative: {alt_out.estimated_exposure_reduction}."
        ),
        cost_comparison=alt_out.cost_difference,
        environmental_impact=env_text,
        disclaimer=(
            "Estimated transport CO2 savings are calculated using standard emission factors "
            "(assuming 25 km/h average urban speed) and are NOT equivalent to measured "
            "improvements in citywide AQI."
        ),
    )
