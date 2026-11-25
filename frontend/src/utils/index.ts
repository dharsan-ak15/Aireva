// ============================================================
// Aireva – Utility Functions
// ============================================================
import type { AQICategory, AQIData, PollutantReading } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─── Class Name Helper ────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── AQI Classification (CPCB India) ─────────────────────────
export function classifyAQI(value: number): AQICategory {
  if (value <= 50) return 'good';
  if (value <= 100) return 'satisfactory';
  if (value <= 200) return 'moderate';
  if (value <= 300) return 'poor';
  if (value <= 400) return 'very_poor';
  return 'severe';
}

export const AQI_CATEGORY_INFO: Record<
  AQICategory,
  { label: string; color: string; bg: string; text: string; border: string; description: string }
> = {
  good: {
    label: 'Good',
    color: '#00b050',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    description: 'Air quality is good. Enjoy outdoor activities.',
  },
  satisfactory: {
    label: 'Satisfactory',
    color: '#92d050',
    bg: 'bg-lime-50',
    text: 'text-lime-800',
    border: 'border-lime-200',
    description: 'Acceptable air quality. Unusually sensitive people should consider limiting prolonged outdoor exertion.',
  },
  moderate: {
    label: 'Moderate',
    color: '#ffcc00',
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    description: 'May cause breathing discomfort to sensitive groups. Limit prolonged outdoor activity.',
  },
  poor: {
    label: 'Poor',
    color: '#ff7c00',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    description: 'Breathing discomfort for most people on prolonged exposure. Avoid outdoor activities.',
  },
  very_poor: {
    label: 'Very Poor',
    color: '#ff0000',
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    description: 'Respiratory illness risk on prolonged exposure. Avoid all outdoor activities.',
  },
  severe: {
    label: 'Severe',
    color: '#7030a0',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    description: 'Serious health effects for everyone. Stay indoors with air purifier if possible.',
  },
  unknown: {
    label: 'Unknown',
    color: '#6b7280',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
    description: 'Air quality data unavailable at this time.',
  },
};

export function getAQICategoryInfo(category: AQICategory) {
  return AQI_CATEGORY_INFO[category] ?? AQI_CATEGORY_INFO.unknown;
}

// ─── Pollutant Helpers ────────────────────────────────────────
export const POLLUTANT_INFO: Record<
  string,
  { label: string; fullName: string; unit: string; safeLimit: number; description: string }
> = {
  pm25: {
    label: 'PM2.5',
    fullName: 'Fine Particulate Matter',
    unit: 'µg/m³',
    safeLimit: 60,
    description: 'Tiny particles that penetrate deep into lungs. Major health concern.',
  },
  pm10: {
    label: 'PM10',
    fullName: 'Coarse Particulate Matter',
    unit: 'µg/m³',
    safeLimit: 100,
    description: 'Larger particles from dust, pollen and smoke.',
  },
  no2: {
    label: 'NO₂',
    fullName: 'Nitrogen Dioxide',
    unit: 'µg/m³',
    safeLimit: 80,
    description: 'Vehicle exhaust and industrial emissions. Irritates airways.',
  },
  so2: {
    label: 'SO₂',
    fullName: 'Sulphur Dioxide',
    unit: 'µg/m³',
    safeLimit: 80,
    description: 'From burning coal and diesel. Can trigger asthma attacks.',
  },
  co: {
    label: 'CO',
    fullName: 'Carbon Monoxide',
    unit: 'mg/m³',
    safeLimit: 4,
    description: 'Colourless gas from incomplete combustion. Reduces oxygen delivery.',
  },
  o3: {
    label: 'O₃',
    fullName: 'Ozone',
    unit: 'µg/m³',
    safeLimit: 100,
    description: 'Ground-level ozone formed from vehicle exhaust in sunlight.',
  },
};

export function getPollutantInfo(parameter: string) {
  const key = parameter.toLowerCase().replace('.', '');
  return POLLUTANT_INFO[key] ?? {
    label: parameter.toUpperCase(),
    fullName: parameter,
    unit: 'µg/m³',
    safeLimit: 100,
    description: 'Air pollutant reading.',
  };
}

export function getPollutantLevel(reading: PollutantReading): 'safe' | 'moderate' | 'unsafe' {
  const info = getPollutantInfo(reading.parameter);
  const ratio = reading.value / info.safeLimit;
  if (ratio <= 0.6) return 'safe';
  if (ratio <= 1.0) return 'moderate';
  return 'unsafe';
}

// ─── Data Freshness ───────────────────────────────────────────
export function isDataStale(lastUpdated: string, staleHours = 2): boolean {
  const updated = new Date(lastUpdated).getTime();
  const now = Date.now();
  return now - updated > staleHours * 60 * 60 * 1000;
}

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60_000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── User Profile Helpers ─────────────────────────────────────
export function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  const prefix = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${prefix}, ${name}` : prefix;
}

export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Commutte CO₂ Estimation ─────────────────────────────────
const CO2_FACTORS: Record<string, number> = {
  walking: 0,
  cycling: 0,
  motorcycle: 0.08,  // kg CO₂/km
  car: 0.17,
  public_transport: 0.04,
  auto_rickshaw: 0.11,
  work_from_home: 0,
};

export function estimateCO2PerDay(
  commuteMethod: string,
  durationMinutes: number,
  avgSpeedKmh = 25
): number | null {
  const factor = CO2_FACTORS[commuteMethod];
  if (factor === undefined) return null;
  const distanceKm = (durationMinutes / 60) * avgSpeedKmh * 2; // round trip
  return parseFloat((factor * distanceKm).toFixed(2));
}

// ─── Miscellaneous ────────────────────────────────────────────
export function truncate(str: string, maxLen: number): string {
  return str.length <= maxLen ? str : str.slice(0, maxLen - 3) + '…';
}

export function formatNumber(n: number, decimals = 1): string {
  return n.toLocaleString('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

export function safeGetAQIData(aqi: AQIData | null): {
  hasData: boolean;
  pm25: PollutantReading | undefined;
  pm10: PollutantReading | undefined;
  no2: PollutantReading | undefined;
} {
  if (!aqi) return { hasData: false, pm25: undefined, pm10: undefined, no2: undefined };
  const find = (p: string) =>
    aqi.pollutants.find((r) => r.parameter.toLowerCase().replace('.', '') === p);
  return {
    hasData: aqi.pollutants.length > 0,
    pm25: find('pm25'),
    pm10: find('pm10'),
    no2: find('no2'),
  };
}
