"""Persistent storage for collected pollutant observations."""

from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from schemas.aqi import HistoricalReading

_DB_PATH = Path(__file__).resolve().parents[1] / "data" / "aqi_history.sqlite3"


def record_readings(
    station_id: str,
    readings: list[HistoricalReading],
    db_path: Path = _DB_PATH,
) -> None:
    if not readings:
        return

    db_path.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for reading in readings:
        timestamp = reading.timestamp
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        else:
            timestamp = timestamp.astimezone(timezone.utc)
        rows.append((
            station_id,
            reading.parameter,
            timestamp.isoformat(),
            reading.value,
            reading.unit,
        ))

    with sqlite3.connect(db_path) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS pollutant_readings (
                station_id TEXT NOT NULL,
                parameter TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                value REAL NOT NULL,
                unit TEXT NOT NULL,
                PRIMARY KEY (station_id, parameter, timestamp)
            )
            """
        )
        connection.executemany(
            """
            INSERT INTO pollutant_readings (station_id, parameter, timestamp, value, unit)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (station_id, parameter, timestamp) DO UPDATE SET
                value = excluded.value,
                unit = excluded.unit
            """,
            rows,
        )


def get_readings(
    station_id: str,
    parameter: str,
    hours: int,
    db_path: Path = _DB_PATH,
) -> list[HistoricalReading]:
    if not db_path.exists():
        return []

    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    with sqlite3.connect(db_path) as connection:
        rows = connection.execute(
            """
            SELECT timestamp, value, unit
            FROM pollutant_readings
            WHERE station_id = ? AND parameter = ? AND timestamp >= ?
            ORDER BY timestamp
            """,
            (station_id, parameter, cutoff),
        ).fetchall()

    return [
        HistoricalReading(
            timestamp=datetime.fromisoformat(timestamp),
            parameter=parameter,
            value=value,
            unit=unit,
        )
        for timestamp, value, unit in rows
    ]