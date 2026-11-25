"""Deterministic recommendation rules engine for Aireva."""

from __future__ import annotations

from typing import Optional

from models.aqi import AQICategoryEnum
from models.recommendations import (
    CategoryEnum,
    PriorityEnum,
    Recommendation,
    TimeOfDayEnum,
)
from models.user import (
    AgeCategoryEnum,
    BudgetEnum,
    CommuteTypeEnum,
    CookingFuelEnum,
    OccupationTypeEnum,
    UserProfile,
)
from schemas.aqi import AQIDataSchema


def _get_aqi_category(aqi_data: Optional[AQIDataSchema]) -> AQICategoryEnum:
    if not aqi_data:
        return AQICategoryEnum.UNKNOWN
    return aqi_data.cpcb_category or aqi_data.computed_category or AQICategoryEnum.UNKNOWN


def _severity_rank(cat: AQICategoryEnum) -> int:
    order = {
        AQICategoryEnum.UNKNOWN: 0,
        AQICategoryEnum.GOOD: 1,
        AQICategoryEnum.SATISFACTORY: 2,
        AQICategoryEnum.MODERATE: 3,
        AQICategoryEnum.POOR: 4,
        AQICategoryEnum.VERY_POOR: 5,
        AQICategoryEnum.SEVERE: 6,
    }
    return order.get(cat, 0)


def generate_recommendations(
    profile: UserProfile,
    aqi_data: Optional[AQIDataSchema] = None,
) -> list[Recommendation]:
    """Generate deterministic, persona-aware daily recommendations."""
    recs: list[Recommendation] = []
    cat = _get_aqi_category(aqi_data)
    sev = _severity_rank(cat)
    aqi_known = cat != AQICategoryEnum.UNKNOWN

    # 1. Young children protection
    if profile.has_young_children and sev >= 4:  # poor, very_poor, severe
        recs.append(
            Recommendation(
                id="rec_children_indoors",
                action="Keep young children indoors and avoid outdoor playground time today",
                reason=(
                    f"Air quality is {cat.value.replace('_', ' ')}. Children breathe faster per kg "
                    "of body weight and are more vulnerable to fine particulate matter."
                ),
                benefit="Significantly reduces children's exposure to PM2.5 and PM10.",
                priority=PriorityEnum.HIGH,
                confidence=0.95,
                time_of_day=TimeOfDayEnum.ALL_DAY,
                category=CategoryEnum.CHILDREN,
                alternative_action="Organize indoor games, reading, or creative activities at home.",
                influenced_by=["has_young_children", "aqi_category"],
            )
        )
    elif profile.has_young_children and sev == 3:  # moderate
        recs.append(
            Recommendation(
                id="rec_children_limit",
                action="Limit vigorous outdoor play for children to shorter periods",
                reason="Moderate pollution can irritate developing airways during prolonged exertion.",
                benefit="Balances physical activity with reduced particulate inhalation.",
                priority=PriorityEnum.MEDIUM,
                confidence=0.85,
                time_of_day=TimeOfDayEnum.EVENING,
                category=CategoryEnum.CHILDREN,
                alternative_action="Choose indoor play if children show coughing or throat irritation.",
                influenced_by=["has_young_children", "aqi_category"],
            )
        )

    # 2. School run timing
    if profile.has_children_school_schedule or profile.has_young_children:
        recs.append(
            Recommendation(
                id="rec_school_commute",
                action=(
                    "Use a well-fitting N95/KN95 mask for the school commute and close vehicle windows"
                    if sev >= 4
                    else "Complete school drop-off before peak morning traffic where possible"
                ),
                reason="Morning traffic emissions spike between 8:00 AM and 10:00 AM.",
                benefit="Reduces roadside exhaust exposure during the daily school run.",
                priority=PriorityEnum.HIGH if sev >= 4 else PriorityEnum.MEDIUM,
                confidence=0.85,
                time_of_day=TimeOfDayEnum.MORNING,
                category=CategoryEnum.COMMUTE,
                alternative_action="Use carpool or covered public transit instead of open-air transport.",
                influenced_by=["has_children_school_schedule", "aqi_category"],
            )
        )

    # 3. Outdoor worker occupational protection
    if profile.occupation_type == OccupationTypeEnum.OUTDOOR:
        if sev >= 3:
            recs.append(
                Recommendation(
                    id="rec_outdoor_worker_mask",
                    action="Wear a certified N95/FFP2 respirator mask for your entire outdoor shift",
                    reason=(
                        f"Air quality is {cat.value.replace('_', ' ')} and outdoor work involves "
                        "prolonged, unavoidable exposure to ambient pollutants."
                    ),
                    benefit="Filters out >95% of fine PM2.5 particles when fitted properly.",
                    priority=PriorityEnum.HIGH,
                    confidence=0.95,
                    time_of_day=TimeOfDayEnum.ALL_DAY,
                    category=CategoryEnum.OCCUPATIONAL,
                    alternative_action="Take short breaks in enclosed indoor spaces away from traffic.",
                    influenced_by=["occupation_type", "aqi_category"],
                )
            )
        recs.append(
            Recommendation(
                id="rec_outdoor_worker_hydration",
                action="Stay hydrated and wash face and hands after outdoor shifts",
                reason="Helps clear settled dust particles and reduces mucosal dryness.",
                benefit="Supports airway comfort during long outdoor shifts.",
                priority=PriorityEnum.MEDIUM,
                confidence=0.8,
                time_of_day=TimeOfDayEnum.AFTERNOON,
                category=CategoryEnum.OCCUPATIONAL,
                influenced_by=["occupation_type"],
            )
        )

    # 4. Commute-based recommendations
    if profile.commute_type in (
        CommuteTypeEnum.MOTORCYCLE,
        CommuteTypeEnum.CYCLING,
        CommuteTypeEnum.WALKING,
        CommuteTypeEnum.AUTO_RICKSHAW,
    ):
        if sev >= 3:
            recs.append(
                Recommendation(
                    id="rec_commute_mask",
                    action="Wear a snug N95 mask during your commute and avoid congested main roads",
                    reason=(
                        f"Commuting via {profile.commute_type.value.replace('_', ' ')} places you "
                        "directly in roadside tailpipe exhaust."
                    ),
                    benefit="Cuts direct inhalation of traffic-related PM2.5 and NO2.",
                    priority=PriorityEnum.HIGH if sev >= 4 else PriorityEnum.MEDIUM,
                    confidence=0.9,
                    time_of_day=TimeOfDayEnum.MORNING,
                    category=CategoryEnum.COMMUTE,
                    alternative_action="Switch to metro, AC bus, or carpool when air quality is poor.",
                    influenced_by=["commute_type", "aqi_category"],
                )
            )
        if sev >= 4:
            recs.append(
                Recommendation(
                    id="rec_commute_switch",
                    action="Switch to metro or enclosed public transport today instead of open-air commute",
                    reason="Open-air commuting during poor/very poor AQI causes high cumulative dose.",
                    benefit="Reduces commute pollutant exposure and lowers personal emissions.",
                    priority=PriorityEnum.HIGH,
                    confidence=0.88,
                    time_of_day=TimeOfDayEnum.MORNING,
                    category=CategoryEnum.COMMUTE,
                    alternative_action="Work from home if your schedule permits.",
                    influenced_by=["commute_type", "aqi_category"],
                )
            )
    elif profile.commute_type == CommuteTypeEnum.PUBLIC_TRANSPORT:
        recs.append(
            Recommendation(
                id="rec_public_transit_tip",
                action=(
                    "Wear a mask while waiting at open bus stops or stations"
                    if sev >= 4
                    else "Continue using public transport; it keeps citywide emissions lower"
                ),
                reason="Public transit reduces per-person emissions compared to private vehicles.",
                benefit="Lower personal carbon footprint with manageable exposure.",
                priority=PriorityEnum.MEDIUM if sev >= 4 else PriorityEnum.LOW,
                confidence=0.85,
                time_of_day=TimeOfDayEnum.MORNING,
                category=CategoryEnum.COMMUTE,
                influenced_by=["commute_type", "aqi_category"],
            )
        )

    # 5. Exercise habits
    if profile.exercises_outdoors:
        if sev >= 4:
            recs.append(
                Recommendation(
                    id="rec_exercise_indoors",
                    action="Move your workout indoors today (yoga, bodyweight, or indoor gym)",
                    reason=(
                        f"Air quality is {cat.value.replace('_', ' ')}. Heavy breathing during "
                        "outdoor exercise draws pollutants deep into the lungs."
                    ),
                    benefit="Maintains fitness routine without high particulate lung deposition.",
                    priority=PriorityEnum.HIGH,
                    confidence=0.95,
                    time_of_day=TimeOfDayEnum.MORNING,
                    category=CategoryEnum.OUTDOOR_ACTIVITY,
                    alternative_action="Do light stretching indoors instead of running outdoors.",
                    influenced_by=["exercises_outdoors", "aqi_category"],
                )
            )
        elif aqi_known and sev <= 2:
            recs.append(
                Recommendation(
                    id="rec_exercise_ok",
                    action="Air quality is currently favorable for your outdoor workout",
                    reason=f"Current AQI category is {cat.value.replace('_', ' ')}.",
                    benefit="Safe opportunity for outdoor cardio; still verify latest readings before heading out.",
                    priority=PriorityEnum.LOW,
                    confidence=0.85,
                    time_of_day=TimeOfDayEnum.MORNING,
                    category=CategoryEnum.OUTDOOR_ACTIVITY,
                    influenced_by=["exercises_outdoors", "aqi_category"],
                )
            )

    # 6. Senior citizens & respiratory sensitivities
    if (
        profile.age_category == AgeCategoryEnum.SENIOR
        or profile.has_elderly
        or profile.has_respiratory_conditions
        or profile.has_cardiovascular_conditions
    ):
        if sev >= 3:
            recs.append(
                Recommendation(
                    id="rec_sensitive_group",
                    action="Avoid strenuous outdoor errands; wear an N95 mask if stepping outside",
                    reason=(
                        "Older adults and individuals with respiratory or cardiovascular sensitivities "
                        "face higher irritation risk even at moderate pollution levels."
                    ),
                    benefit="Protects sensitive airways and reduces symptom flare-up risk.",
                    priority=PriorityEnum.HIGH if sev >= 4 else PriorityEnum.MEDIUM,
                    confidence=0.92,
                    time_of_day=TimeOfDayEnum.AFTERNOON,
                    category=CategoryEnum.HEALTH,
                    alternative_action="Keep prescribed inhalers/medications accessible and consult a doctor if symptoms occur.",
                    influenced_by=["has_respiratory_conditions", "has_elderly", "aqi_category"],
                )
            )

    # 7. Air purifier & indoor management
    if profile.has_air_purifier and sev >= 3:
        recs.append(
            Recommendation(
                id="rec_purifier_run",
                action="Run your HEPA air purifier in the main living room and bedroom",
                reason="Continuous filtration lowers indoor PM2.5 levels when outdoor air is polluted.",
                benefit="Can reduce indoor fine particulate concentration substantially in closed rooms.",
                priority=PriorityEnum.HIGH if sev >= 4 else PriorityEnum.MEDIUM,
                confidence=0.9,
                time_of_day=TimeOfDayEnum.NIGHT,
                category=CategoryEnum.INDOOR,
                alternative_action="Keep bedroom doors closed while running the purifier at night.",
                influenced_by=["has_air_purifier", "aqi_category"],
            )
        )
    elif not profile.has_air_purifier and sev >= 4 and profile.budget != BudgetEnum.LOW:
        recs.append(
            Recommendation(
                id="rec_consider_purifier",
                action="Consider a true HEPA air purifier for your primary sleeping room",
                reason="Nighttime exposure accounts for ~8 hours of daily breathing.",
                benefit="Creates a cleaner-air sanctuary for sleep during severe smog episodes.",
                priority=PriorityEnum.MEDIUM,
                confidence=0.82,
                time_of_day=TimeOfDayEnum.NIGHT,
                category=CategoryEnum.INDOOR,
                alternative_action="Use wet mopping and keep windows sealed during peak traffic hours.",
                influenced_by=["has_air_purifier", "budget", "aqi_category"],
            )
        )

    # 8. Cooking fuel & kitchen ventilation
    if profile.cooking_fuel in (CookingFuelEnum.BIOMASS, CookingFuelEnum.KEROSENE):
        recs.append(
            Recommendation(
                id="rec_cooking_biomass",
                action="Ensure strong cross-ventilation while cooking; open kitchen windows/doors",
                reason="Biomass and kerosene combustion emit high indoor PM2.5 and carbon monoxide.",
                benefit="Prevents dangerous indoor smoke accumulation.",
                priority=PriorityEnum.HIGH,
                confidence=0.95,
                time_of_day=TimeOfDayEnum.AFTERNOON,
                category=CategoryEnum.INDOOR,
                alternative_action="Transition toward LPG, PNG, or induction cooking where feasible.",
                influenced_by=["cooking_fuel"],
            )
        )
    elif not profile.has_exhaust_fan_kitchen:
        recs.append(
            Recommendation(
                id="rec_cooking_exhaust",
                action="Open a kitchen window or use a table fan to vent cooking fumes",
                reason="Cooking without an exhaust fan increases indoor ultrafine particles and NO2.",
                benefit="Reduces lingering indoor cooking emissions.",
                priority=PriorityEnum.MEDIUM,
                confidence=0.85,
                time_of_day=TimeOfDayEnum.AFTERNOON,
                category=CategoryEnum.INDOOR,
                influenced_by=["has_exhaust_fan_kitchen"],
            )
        )

    # 9. Incense & mosquito coils
    if profile.uses_incense or profile.uses_mosquito_coils:
        recs.append(
            Recommendation(
                id="rec_incense_coils",
                action="Avoid burning incense or mosquito coils in closed rooms",
                reason="Smoldering coils and incense release concentrated PM2.5 and VOCs indoors.",
                benefit="Prevents avoidable indoor pollution spikes, especially at night.",
                priority=PriorityEnum.MEDIUM,
                confidence=0.9,
                time_of_day=TimeOfDayEnum.EVENING,
                category=CategoryEnum.INDOOR,
                alternative_action="Use mosquito nets or liquid vaporizers in ventilated rooms.",
                influenced_by=["uses_incense", "uses_mosquito_coils"],
            )
        )

    # 10. Window & ventilation management
    if sev >= 4:
        recs.append(
            Recommendation(
                id="rec_windows_peak",
                action="Keep windows closed during peak traffic hours (8–10 AM and 5–8 PM)",
                reason="Ambient PM2.5 and traffic exhaust peak during rush hours and winter inversions.",
                benefit="Reduces outdoor-to-indoor pollution infiltration.",
                priority=PriorityEnum.MEDIUM,
                confidence=0.85,
                time_of_day=TimeOfDayEnum.EVENING,
                category=CategoryEnum.INDOOR,
                alternative_action="Ventilate briefly during midday if outdoor visibility and readings improve.",
                influenced_by=["aqi_category"],
            )
        )
    else:
        recs.append(
            Recommendation(
                id="rec_ventilation_general",
                action="Cross-ventilate your home briefly when outdoor air looks clearer",
                reason="Fresh air exchange prevents indoor CO2 and moisture buildup.",
                benefit="Maintains healthy indoor oxygen and prevents mould.",
                priority=PriorityEnum.LOW,
                confidence=0.8,
                time_of_day=TimeOfDayEnum.AFTERNOON,
                category=CategoryEnum.INDOOR,
                influenced_by=["aqi_category"],
            )
        )

    # 11. Nighttime bedroom habit
    recs.append(
        Recommendation(
            id="rec_night_dust",
            action="Damp-wipe bedroom surfaces and keep shoes outside the living area",
            reason="Tracked-in road dust resuspends indoors and irritates airways overnight.",
            benefit="Cleaner sleeping environment with minimal cost.",
            priority=PriorityEnum.LOW,
            confidence=0.85,
            time_of_day=TimeOfDayEnum.NIGHT,
            category=CategoryEnum.INDOOR,
            influenced_by=["city"],
        )
    )

    return recs
