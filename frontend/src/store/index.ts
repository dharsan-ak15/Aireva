// ============================================================
// Aireva – Zustand Global Store
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserProfile,
  AQIData,
  Recommendation,
  DailyProgress,
  IndoorChecklistItem,
  OnboardingStep,
} from '../types';

// ─── User Store ───────────────────────────────────────────────
interface UserStore {
  profile: UserProfile | null;
  onboardingStep: OnboardingStep;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
  setOnboardingStep: (step: OnboardingStep) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: null,
      onboardingStep: 'welcome',
      setProfile: (profile) => set({ profile, onboardingStep: 'complete' }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates, updatedAt: new Date().toISOString() }
            : null,
        })),
      clearProfile: () => set({ profile: null, onboardingStep: 'welcome' }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
    }),
    { name: 'aireva-user-profile' }
  )
);

// ─── AQI Store ────────────────────────────────────────────────
interface AQIStore {
  currentData: AQIData | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
  setAQIData: (data: AQIData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearData: () => void;
}

export const useAQIStore = create<AQIStore>()((set) => ({
  currentData: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  setAQIData: (data) =>
    set({ currentData: data, error: null, lastFetched: new Date().toISOString() }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  clearData: () => set({ currentData: null, error: null, lastFetched: null }),
}));

// ─── Recommendations Store ────────────────────────────────────
interface RecommendationStore {
  recommendations: Recommendation[];
  isLoading: boolean;
  error: string | null;
  lastGenerated: string | null;
  setRecommendations: (recs: Recommendation[]) => void;
  toggleComplete: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRecommendationStore = create<RecommendationStore>()(
  persist(
    (set) => ({
      recommendations: [],
      isLoading: false,
      error: null,
      lastGenerated: null,
      setRecommendations: (recommendations) =>
        set({ recommendations, error: null, lastGenerated: new Date().toISOString() }),
      toggleComplete: (id) =>
        set((state) => ({
          recommendations: state.recommendations.map((r) =>
            r.id === id ? { ...r, isCompleted: !r.isCompleted } : r
          ),
        })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error, isLoading: false }),
    }),
    { name: 'aireva-recommendations' }
  )
);

// ─── Progress Store ───────────────────────────────────────────
interface ProgressStore {
  dailyProgress: Record<string, DailyProgress>; // date string -> progress
  addProgress: (date: string, progress: DailyProgress) => void;
  updateProgress: (date: string, updates: Partial<DailyProgress>) => void;
  getWeekProgress: () => DailyProgress[];
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      dailyProgress: {},
      addProgress: (date, progress) =>
        set((state) => ({
          dailyProgress: { ...state.dailyProgress, [date]: progress },
        })),
      updateProgress: (date, updates) =>
        set((state) => ({
          dailyProgress: {
            ...state.dailyProgress,
            [date]: { ...state.dailyProgress[date], ...updates },
          },
        })),
      getWeekProgress: () => {
        const days: DailyProgress[] = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const key = d.toISOString().split('T')[0];
          if (get().dailyProgress[key]) {
            days.push(get().dailyProgress[key]);
          }
        }
        return days;
      },
    }),
    { name: 'aireva-progress' }
  )
);

// ─── Indoor Checklist Store ────────────────────────────────────
interface IndoorStore {
  checklist: IndoorChecklistItem[];
  setChecklist: (items: IndoorChecklistItem[]) => void;
  toggleItem: (id: string) => void;
}

export const useIndoorStore = create<IndoorStore>()(
  persist(
    (set) => ({
      checklist: [],
      setChecklist: (checklist) => set({ checklist }),
      toggleItem: (id) =>
        set((state) => ({
          checklist: state.checklist.map((item) =>
            item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
          ),
        })),
    }),
    { name: 'aireva-indoor-checklist' }
  )
);

// ─── UI Store ─────────────────────────────────────────────────
interface UIStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
