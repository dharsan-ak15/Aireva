// ============================================================
// Aireva – API Service Layer (with Frontend/Backend Schema Adapters)
// ============================================================
import axios, { AxiosError } from 'axios';
import type {
  AQIData,
  UserProfile,
  Recommendation,
  AIResponse,
  IndoorChecklistItem,
  SimulatorResult,
  RoutineScenario,
  StationSearchResult,
  HistoricalReading,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TIMEOUT_MS = 15_000;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const msg =
      (error.response?.data as { detail?: string })?.detail ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(msg));
  }
);

// ─── Adapters ─────────────────────────────────────────────────

function mapBackendAQI(raw: any): AQIData {
  const aqiVal = raw.cpcb_aqi ?? raw.computed_aqi ?? undefined;
  const aqiCat = raw.cpcb_category ?? raw.computed_category ?? undefined;
  const aqiSrc =
    raw.cpcb_aqi != null
      ? raw.cpcb_source || 'CPCB'
      : raw.computed_aqi != null
      ? 'OpenAQ (CPCB Scale Estimate)'
      : undefined;

  return {
    stationId: String(raw.station_id ?? ''),
    stationName: raw.station_name ?? 'Unknown Station',
    city: raw.city ?? '',
    state: raw.state ?? '',
    country: raw.country ?? 'IN',
    latitude: raw.latitude ?? undefined,
    longitude: raw.longitude ?? undefined,
    aqiValue: aqiVal,
    aqiCategory: aqiCat,
    aqiSource: aqiSrc,
    pollutants: (raw.readings ?? []).map((r: any) => ({
      parameter: r.parameter,
      value: r.value,
      unit: r.unit,
      lastUpdated: r.last_updated || raw.last_updated || new Date().toISOString(),
    })),
    lastUpdated: raw.last_updated || new Date().toISOString(),
    dataProvider: raw.data_provider || (raw.cpcb_aqi != null ? 'CPCB (via OpenAQ)' : 'OpenAQ v3'),
    isStale: Boolean(raw.is_stale),
  };
}

function mapFrontendAQIToBackend(aqi: AQIData | null): any {
  if (!aqi) return null;
  return {
    station_id: aqi.stationId,
    station_name: aqi.stationName,
    city: aqi.city,
    country: aqi.country,
    latitude: aqi.latitude,
    longitude: aqi.longitude,
    readings: aqi.pollutants.map((p) => ({
      parameter: p.parameter,
      value: p.value,
      unit: p.unit,
      last_updated: p.lastUpdated,
    })),
    computed_aqi: aqi.aqiValue ?? null,
    computed_category: aqi.aqiCategory ?? null,
    is_stale: aqi.isStale,
    last_updated: aqi.lastUpdated,
  };
}

function mapFrontendProfileToBackend(profile: UserProfile): any {
  const ageMap: Record<string, string> = {
    senior_citizen: 'senior',
  };
  const occMap: Record<string, string> = {
    outdoor_worker: 'outdoor',
    student: 'student',
    senior_citizen: 'retired',
  };
  const fuelMap: Record<string, string> = {
    png: 'piped_gas',
    induction: 'electric',
  };

  return {
    user_id: profile.id,
    name: profile.name,
    age_category: ageMap[profile.category] ?? 'adult',
    has_young_children: profile.household.hasYoungChildren,
    has_elderly: profile.household.hasOlderAdults,
    has_respiratory_conditions: profile.household.hasRespiratoryConditions,
    has_cardiovascular_conditions: false,
    commute_type: profile.lifestyle.commuteMethod,
    occupation_type: occMap[profile.category] ?? 'indoor',
    exercises_outdoors: profile.lifestyle.exerciseHabit.includes('outdoor'),
    city: profile.location.city,
    cooking_fuel: fuelMap[profile.lifestyle.cookingFuel] ?? profile.lifestyle.cookingFuel,
    has_air_purifier: profile.lifestyle.hasAirPurifier,
    has_exhaust_fan_kitchen: profile.lifestyle.hasKitchenExhaust,
    uses_incense: Boolean(profile.lifestyle.usesIncense),
    uses_mosquito_coils: Boolean(profile.lifestyle.usesMosquitoCoils),
    has_children_school_schedule: Boolean(
      profile.lifestyle.schoolSchedule || profile.household.hasYoungChildren
    ),
    budget: profile.lifestyle.budget,
  };
}

// ─── AQI Endpoints ────────────────────────────────────────────

export async function fetchAQIByCity(city: string, country = 'IN'): Promise<AQIData> {
  const { data } = await api.get('/aqi/city', { params: { city, country } });
  return mapBackendAQI(data);
}

export async function fetchAQIByStation(stationId: string): Promise<AQIData> {
  const { data } = await api.get(`/aqi/station/${stationId}`);
  return mapBackendAQI(data);
}

export async function searchStations(
  city: string,
  country = 'IN'
): Promise<StationSearchResult[]> {
  const { data } = await api.get('/aqi/stations', { params: { city, country } });
  return (data ?? []).map((s: any) => ({
    id: String(s.station_id ?? s.id ?? ''),
    name: s.station_name ?? s.name ?? 'Unknown',
    city: s.city ?? city,
    state: s.state ?? '',
    country: s.country ?? country,
    latitude: s.latitude,
    longitude: s.longitude,
    parameters: s.parameters ?? [],
  }));
}

export async function fetchHistoricalReadings(
  stationId: string,
  parameter: string,
  hours = 48
): Promise<HistoricalReading[]> {
  const { data } = await api.get('/aqi/history', {
    params: { station_id: stationId, parameter, hours },
  });
  return data;
}

// ─── Recommendations Endpoints ────────────────────────────────

export async function fetchRecommendations(
  profile: UserProfile,
  aqiData: AQIData | null
): Promise<Recommendation[]> {
  const { data } = await api.post('/recommendations/daily', {
    profile: mapFrontendProfileToBackend(profile),
    aqi_data: mapFrontendAQIToBackend(aqiData),
  });
  return (data ?? []).map((r: any) => ({
    id: r.id,
    action: r.action,
    reason: r.reason,
    benefit: r.benefit,
    priority: r.priority,
    confidence:
      typeof r.confidence === 'number'
        ? r.confidence >= 0.85
          ? 'high'
          : r.confidence >= 0.65
          ? 'medium'
          : 'low'
        : r.confidence || 'medium',
    timeOfDay: r.time_of_day || 'all_day',
    category:
      r.category === 'outdoor_activity'
        ? 'outdoor'
        : r.category === 'children' || r.category === 'occupational' || r.category === 'general'
        ? 'health'
        : r.category,
    alternativeAction: r.alternative_action,
    influencedBy: Array.isArray(r.influenced_by) ? r.influenced_by.join(', ') : r.influenced_by,
    dataTimestamp: aqiData?.lastUpdated,
  }));
}

// ─── Gemini AI Endpoints ──────────────────────────────────────

export async function askAI(
  question: string,
  profile: UserProfile | null,
  aqiData: AQIData | null
): Promise<AIResponse> {
  const { data } = await api.post('/ai/ask', {
    question,
    profile: profile ? mapFrontendProfileToBackend(profile) : null,
    aqi_data: mapFrontendAQIToBackend(aqiData),
  });
  return {
    summary: data.summary ?? '',
    air_quality_context: data.air_quality_context ?? '',
    recommendations: (data.recommendations ?? []).map((r: any) => ({
      action: r.action ?? '',
      reason: r.reason ?? '',
      benefit: r.benefit ?? '',
      priority: r.priority ?? 'medium',
      confidence: r.confidence ?? 'medium',
    })),
    alternatives: data.alternatives ?? [],
    limitations: data.limitations ?? [],
    isAIGenerated: Boolean(data.is_ai_generated),
  };
}

// ─── Indoor Advisor Endpoints ─────────────────────────────────

export async function fetchIndoorChecklist(
  profile: UserProfile
): Promise<IndoorChecklistItem[]> {
  const { data } = await api.post('/indoor/checklist', {
    profile: mapFrontendProfileToBackend(profile),
  });
  return (data ?? []).map((item: any) => ({
    id: item.id,
    title: item.action,
    description: item.reason,
    whyItMatters: item.reason,
    estimatedCost: item.cost || 'low',
    difficulty: item.cost === 'high' ? 'involved' : item.cost === 'medium' ? 'moderate' : 'easy',
    expectedBenefit: 'Reduces indoor particulate and pollutant accumulation.',
    maintenanceFrequency: item.frequency || 'regularly',
    category:
      item.id.includes('cook') || item.id.includes('exhaust')
        ? 'cooking'
        : item.id.includes('hepa')
        ? 'purification'
        : item.id.includes('ventilation')
        ? 'ventilation'
        : item.id.includes('mop') || item.id.includes('bedding')
        ? 'cleaning'
        : 'prevention',
  }));
}

// ─── Simulator Endpoints ──────────────────────────────────────

export async function runSimulation(
  currentScenario: Partial<RoutineScenario>,
  alternativeScenario: Partial<RoutineScenario>,
  profile: UserProfile
): Promise<SimulatorResult> {
  const toBackendScenario = (s: Partial<RoutineScenario>, fallbackName: string) => ({
    id: s.id ?? fallbackName.toLowerCase().replace(/\s+/g, '_'),
    name: s.name ?? fallbackName,
    description: s.description ?? '',
    commute_method: s.commuteMethod ?? 'public_transport',
    commute_duration_minutes: s.commuteDurationMinutes ?? 30,
    exercises_outdoors: String(s.exerciseHabit ?? '').includes('outdoor'),
    ventilation_timing: s.ventilationTiming ?? 'avoid_peak',
  });

  const { data } = await api.post('/simulator/compare', {
    current: toBackendScenario(currentScenario, 'Current Routine'),
    alternative: toBackendScenario(alternativeScenario, 'Alternative Routine'),
    profile: mapFrontendProfileToBackend(profile),
  });

  const mapScenario = (s: any): RoutineScenario => ({
    id: s.id,
    name: s.name,
    description: s.description,
    commuteMethod: s.commute_method,
    commuteDurationMinutes: s.commute_duration_minutes,
    exerciseHabit: s.exercises_outdoors ? 'moderate_outdoor' : 'moderate_indoor',
    ventilationTiming: s.ventilation_timing,
    estimatedCO2KgPerDay: s.estimated_co2_kg_per_day,
    estimatedExposureReduction: s.estimated_exposure_reduction,
    convenienceScore: s.convenience_score,
    costDifference: s.cost_difference,
  });

  return {
    currentScenario: mapScenario(data.current_scenario),
    alternativeScenario: mapScenario(data.alternative_scenario),
    co2Difference: data.co2_difference_kg_per_day,
    exposureComparison: data.exposure_comparison,
    costComparison: data.cost_comparison,
    environmentalImpact: data.environmental_impact,
    disclaimer: data.disclaimer,
  };
}

// ─── User Profile Endpoints ───────────────────────────────────

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  await api.post('/users/profile', mapFrontendProfileToBackend(profile));
  return profile;
}

export async function loadProfile(userId: string): Promise<UserProfile> {
  const { data } = await api.get(`/users/profile/${userId}`);
  return data;
}

// ─── Health Check ─────────────────────────────────────────────

export async function checkHealth(): Promise<{ status: string; version: string }> {
  const { data } = await api.get('/health');
  return data;
}

export default api;
