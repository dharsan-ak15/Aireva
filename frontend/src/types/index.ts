// ============================================================
// Aireva – Central Type Definitions
// ============================================================

// ─── AQI & Pollution Data ────────────────────────────────────

export type AQICategory =
  | 'good'
  | 'satisfactory'
  | 'moderate'
  | 'poor'
  | 'very_poor'
  | 'severe'
  | 'unknown';

export interface PollutantReading {
  parameter: string;        // pm25, pm10, no2, so2, co, o3
  value: number;
  unit: string;             // µg/m³, ppm, ppb
  lastUpdated: string;      // ISO timestamp
}

export interface AQIData {
  stationId: string;
  stationName: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  aqiValue?: number;        // Official AQI or a clearly identified estimate
  aqiCategory?: AQICategory;
  aqiSource?: string;
  isAqiEstimated?: boolean;
  pollutants: PollutantReading[];
  lastUpdated: string;      // ISO timestamp
  dataProvider: string;
  isStale: boolean;         // true if >2 hours old
  availableFrom?: string;   // Data availability start
}

export interface HistoricalReading {
  timestamp: string;
  value: number;
  parameter: string;
  unit: string;
}

export interface StationSearchResult {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  lastMeasurement?: string;
  parameters: string[];
}

// ─── User Profile ─────────────────────────────────────────────

export type UserCategory =
  | 'family'
  | 'working_professional'
  | 'student'
  | 'senior_citizen'
  | 'outdoor_worker'
  | 'community_organizer';

export type CommuteMethod =
  | 'walking'
  | 'cycling'
  | 'motorcycle'
  | 'car'
  | 'public_transport'
  | 'auto_rickshaw'
  | 'work_from_home';

export type CookingFuel =
  | 'lpg'
  | 'png'
  | 'electric'
  | 'biomass'
  | 'kerosene'
  | 'induction';

export type ExerciseHabit =
  | 'none'
  | 'light_indoor'
  | 'moderate_indoor'
  | 'light_outdoor'
  | 'moderate_outdoor'
  | 'intense_outdoor';

export type Budget = 'low' | 'medium' | 'high';

export interface UserLocation {
  country: string;
  state: string;
  city: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
}

export interface HouseholdDetails {
  numberOfMembers: number;
  hasYoungChildren: boolean;
  childrenAgeGroups?: string[];     // 'infant', 'toddler', 'school_age'
  hasOlderAdults: boolean;
  olderAdultCount?: number;
  hasRespiratoryConditions: boolean; // self-reported, not diagnostic
  householdSqFt?: number;
}

export interface LifestyleDetails {
  workSchedule?: string;            // e.g. '9am-6pm'
  schoolSchedule?: string;
  commuteMethod: CommuteMethod;
  commuteDurationMinutes: number;
  exerciseHabit: ExerciseHabit;
  cookingFuel: CookingFuel;
  hasKitchenExhaust: boolean;
  hasAirPurifier: boolean;
  airPurifierCount?: number;
  budget: Budget;
  burnsWaste?: boolean;
  usesIncense?: boolean;
  usesMosquitoCoils?: boolean;
}

export interface UserProfile {
  id: string;
  name?: string;
  category: UserCategory;
  location: UserLocation;
  household: HouseholdDetails;
  lifestyle: LifestyleDetails;
  savedStationId?: string;
  createdAt: string;
  updatedAt: string;
  onboardingComplete: boolean;
}

// ─── Recommendations ──────────────────────────────────────────

export type RecommendationPriority = 'high' | 'medium' | 'low';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'all_day';

export interface Recommendation {
  id: string;
  action: string;
  reason: string;
  benefit: string;
  priority: RecommendationPriority;
  confidence: ConfidenceLevel;
  timeOfDay: TimeOfDay;
  category: 'outdoor' | 'indoor' | 'commute' | 'exercise' | 'ventilation' | 'health' | 'sustainability';
  alternativeAction?: string;
  dataTimestamp?: string;
  influencedBy?: string;
  isCompleted?: boolean;
  savedAt?: string;
}

// ─── Gemini AI Response ───────────────────────────────────────

export interface AIRecommendation {
  action: string;
  reason: string;
  benefit: string;
  priority: RecommendationPriority;
  confidence: ConfidenceLevel;
}

export interface AIResponse {
  summary: string;
  air_quality_context: string;
  recommendations: AIRecommendation[];
  alternatives: string[];
  limitations: string[];
  isAIGenerated: boolean;    // false = deterministic fallback
  modelUsed?: string;
  fallbackReason?: string;
}

// ─── Indoor Air Quality ───────────────────────────────────────

export interface IndoorChecklistItem {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  estimatedCost: 'free' | 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'moderate' | 'involved';
  expectedBenefit: string;
  maintenanceFrequency: string;
  category: 'ventilation' | 'purification' | 'cleaning' | 'cooking' | 'prevention';
  isCompleted?: boolean;
}

// ─── Simulator ────────────────────────────────────────────────

export interface RoutineScenario {
  id: string;
  name: string;
  description: string;
  commuteMethod: CommuteMethod;
  commuteDurationMinutes: number;
  exerciseHabit: ExerciseHabit;
  ventilationTiming: 'early_morning' | 'avoid_peak' | 'evening' | 'windows_closed';
  estimatedCO2KgPerDay?: number;     // Only when calculable
  estimatedExposureReduction?: string;
  convenienceScore: number;           // 1-10
  costDifference?: string;
}

export interface SimulatorResult {
  currentScenario: RoutineScenario;
  alternativeScenario: RoutineScenario;
  co2Difference?: number;             // kg/day, only when measurable
  exposureComparison: string;
  costComparison: string;
  environmentalImpact: string;
  disclaimer: string;
}

// ─── Progress Tracker ─────────────────────────────────────────

export interface DailyProgress {
  date: string;
  recommendationsCount: number;
  completedCount: number;
  sustainableChoices: string[];
  estimatedCO2Avoided?: number;
}

export interface WeeklyProgress {
  weekStart: string;
  weekEnd: string;
  days: DailyProgress[];
  totalCompleted: number;
  totalRecommendations: number;
  streakDays: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt: string;
  icon: string;
}

// ─── Community ────────────────────────────────────────────────

export interface CommunityTip {
  id: string;
  title: string;
  description: string;
  category: 'transport' | 'waste' | 'green_spaces' | 'awareness' | 'policy';
  impact: string;
  actionable: boolean;
}

// ─── API Response Wrappers ────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: 'success' | 'error' | 'unavailable';
  timestamp: string;
}

export interface AQIApiResponse {
  data?: AQIData;
  error?: string;
  status: 'success' | 'error' | 'unavailable' | 'stale';
  source?: string;
  lastAttempted: string;
}

// ─── Navigation ───────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  description?: string;
}

// ─── Onboarding ───────────────────────────────────────────────

export type OnboardingStep =
  | 'welcome'
  | 'location'
  | 'category'
  | 'household'
  | 'lifestyle'
  | 'complete';

export interface OnboardingState {
  currentStep: OnboardingStep;
  profile: Partial<UserProfile>;
  isComplete: boolean;
}
