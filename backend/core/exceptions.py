"""Custom exception classes."""

from __future__ import annotations


class AirevaBaseError(Exception):
    """Base class for Aireva errors."""


class UpstreamUnavailableError(AirevaBaseError):
    """Raised when an upstream API is unavailable."""


class StaleDataError(AirevaBaseError):
    """Raised when cached data is considered too old to use."""


class InvalidMeasurementError(AirevaBaseError):
    """Raised when a measurement value is physically implausible."""


class ConfigurationError(AirevaBaseError):
    """Raised when required configuration is missing."""


class UserNotFoundError(AirevaBaseError):
    """Raised when a requested user profile does not exist."""
