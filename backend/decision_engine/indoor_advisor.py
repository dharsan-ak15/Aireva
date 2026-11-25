"""Deterministic indoor air quality checklist generator."""

from __future__ import annotations

from models.recommendations import CategoryEnum, IndoorChecklistItem, PriorityEnum
from models.user import BudgetEnum, CookingFuelEnum, UserProfile


def generate_indoor_checklist(profile: UserProfile) -> list[IndoorChecklistItem]:
    """Generate a personalized indoor air quality improvement checklist."""
    items: list[IndoorChecklistItem] = []

    # 1. Wet mopping (always)
    items.append(
        IndoorChecklistItem(
            id="indoor_wet_mop",
            action="Wet-mop floors daily instead of dry sweeping",
            reason="Dry sweeping kicks settled PM2.5 and dust back into breathing height.",
            priority=PriorityEnum.HIGH,
            cost="low",
            category=CategoryEnum.INDOOR,
            frequency="daily",
        )
    )

    # 2. Cooking fuel / exhaust
    if profile.cooking_fuel in (CookingFuelEnum.BIOMASS, CookingFuelEnum.KEROSENE):
        items.append(
            IndoorChecklistItem(
                id="indoor_clean_cooking",
                action="Transition from biomass/kerosene to LPG, PNG, or induction and ventilate kitchen",
                reason="Solid fuel and kerosene smoke are leading sources of severe indoor PM2.5 and CO.",
                priority=PriorityEnum.HIGH,
                cost="medium",
                category=CategoryEnum.INDOOR,
                frequency="daily",
            )
        )

    if not profile.has_exhaust_fan_kitchen:
        items.append(
            IndoorChecklistItem(
                id="indoor_kitchen_exhaust",
                action="Install a kitchen exhaust fan or chimney and run it while cooking",
                reason="Captures cooking smoke, oil aerosols, and NO2 at the source.",
                priority=PriorityEnum.HIGH,
                cost="medium",
                category=CategoryEnum.INDOOR,
                frequency="daily",
            )
        )
    else:
        items.append(
            IndoorChecklistItem(
                id="indoor_exhaust_clean",
                action="Clean kitchen exhaust fan/chimney baffles monthly",
                reason="Grease buildup reduces airflow and exhaust efficiency.",
                priority=PriorityEnum.MEDIUM,
                cost="low",
                category=CategoryEnum.INDOOR,
                frequency="monthly",
            )
        )

    # 3. Incense & mosquito coils
    if profile.uses_incense:
        items.append(
            IndoorChecklistItem(
                id="indoor_incense",
                action="Reduce incense burning or use only with open windows",
                reason="Incense smoke emits fine particulates and polycyclic aromatic hydrocarbons.",
                priority=PriorityEnum.MEDIUM,
                cost="low",
                category=CategoryEnum.INDOOR,
                frequency="daily",
            )
        )

    if profile.uses_mosquito_coils:
        items.append(
            IndoorChecklistItem(
                id="indoor_mosquito_coils",
                action="Replace mosquito coils with bed nets or window mesh screens",
                reason="One burning mosquito coil can emit PM2.5 equivalent to dozens of cigarettes.",
                priority=PriorityEnum.HIGH,
                cost="low",
                category=CategoryEnum.INDOOR,
                frequency="daily",
            )
        )

    # 4. Air purifier
    if profile.has_air_purifier:
        items.append(
            IndoorChecklistItem(
                id="indoor_hepa_maintenance",
                action="Inspect pre-filter monthly and replace HEPA filter every 6–12 months",
                reason="Clogged filters lose CADR airflow and allow particles to bypass.",
                priority=PriorityEnum.HIGH,
                cost="medium",
                category=CategoryEnum.INDOOR,
                frequency="monthly",
            )
        )
    elif profile.budget != BudgetEnum.LOW:
        items.append(
            IndoorChecklistItem(
                id="indoor_hepa_bedroom",
                action="Add a true HEPA air purifier sized for your primary bedroom",
                reason="Lowers nighttime PM2.5 exposure; ordinary houseplants cannot replace mechanical filtration.",
                priority=PriorityEnum.MEDIUM,
                cost="high",
                category=CategoryEnum.INDOOR,
                frequency="once",
            )
        )

    # 5. Balanced ventilation & moisture control
    items.append(
        IndoorChecklistItem(
            id="indoor_balanced_ventilation",
            action="Time natural ventilation during lower-traffic midday hours rather than sealing permanently",
            reason="Permanent sealing traps indoor CO2, VOCs, and moisture that promote mould growth.",
            priority=PriorityEnum.MEDIUM,
            cost="low",
            category=CategoryEnum.INDOOR,
            frequency="daily",
        )
    )

    items.append(
        IndoorChecklistItem(
            id="indoor_moisture_mould",
            action="Check bathrooms and damp corners for mould and fix leaks promptly",
            reason="Indoor dampness and mould spores worsen respiratory irritation.",
            priority=PriorityEnum.MEDIUM,
            cost="low",
            category=CategoryEnum.INDOOR,
            frequency="weekly",
        )
    )

    if profile.has_young_children or profile.has_respiratory_conditions:
        items.append(
            IndoorChecklistItem(
                id="indoor_bedding_wash",
                action="Wash bedsheets weekly in hot water and clean AC/cooler filters monthly",
                reason="Reduces dust mites and allergens for sensitive household members.",
                priority=PriorityEnum.MEDIUM,
                cost="low",
                category=CategoryEnum.INDOOR,
                frequency="weekly",
            )
        )

    return items
