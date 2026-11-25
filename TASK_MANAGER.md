# Aireva (BreatheWise) – Task Manager

**Last Updated:** 2026-11-25

---

## ✅ Completed

### 1. Project Scaffolding & Configuration
- Frontend Vite + React + TypeScript + Tailwind CSS setup (`frontend/package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/index.css`)
- Backend FastAPI project structure (`backend/main.py`, `requirements.txt`, `Dockerfile`, `.env.example`, `.gitignore`)
- Core backend config, logging, and exceptions (`backend/core/config.py`, `logging.py`, `exceptions.py`)

### 2. Frontend Core, Types, State & Layout
- TypeScript domain types (`frontend/src/types/index.ts`)
- Zustand persisted global stores (`frontend/src/store/index.ts`)
- API client layer (`frontend/src/services/api.ts`)
- Utility helpers & CPCB AQI classification (`frontend/src/utils/index.ts`)
- Reusable UI components (`frontend/src/components/ui/index.tsx`)
- Responsive Layout, collapsible Sidebar, and TopBar (`frontend/src/components/layout/Layout.tsx`, `Sidebar.tsx`, `TopBar.tsx`)
- Multi-step Onboarding Flow (`frontend/src/components/onboarding/OnboardingFlow.tsx`)
- AQI display components (`AQICard.tsx`, `PollutantCard.tsx`, `PollutantGrid.tsx`)
- Recharts visualizations (`PollutantTrendChart.tsx`, `WeeklyProgressChart.tsx`)
- Custom hooks (`useAQI.ts`, `useRecommendations.ts`)

### 3. Frontend Pages & Assets Built
- `DashboardPage.tsx` (Home dashboard with greeting, AQI summary, top recommendations, weekly progress, quick actions)
- `AQIMonitorPage.tsx` (Live AQI monitor, station search, pollutant breakdown, 48h trend chart)
- `RoutinePlannerPage.tsx` (Personalized daily routine planner with time-of-day filters & completion tracking)
- `IndoorAdvisorPage.tsx` (Interactive indoor air quality checklist & cost/difficulty details)
- `SustainableChoicesPage.tsx` (Sustainable transport, household energy, waste management & comparisons)
- `AIAssistantPage.tsx` (BreatheWise / Aireva AI chat UI with structured responses & fallback banner)
- `SimulatorPage.tsx` (Interactive What-If lifestyle routine comparison simulator)
- `ProgressPage.tsx` (Personal clean-air progress tracker, weekly charts, achievements)
- `CommunityPage.tsx` (Community awareness, waste-burning prevention, urban greening)
- `ProfilePage.tsx` (View & edit profile preferences, reset onboarding)
- `frontend/public/favicon.svg`
- `frontend/src/services/api.ts` (Adapter mapping between frontend camelCase types and backend snake_case schemas)

### 4. Backend Services, Decision Engine & API Routes
- Domain models & schemas (`backend/models/*`, `backend/schemas/*`)
- OpenAQ v3 HTTPX client & AQI service with validation, staleness check, and 10-min cache (`openaq_client.py`, `aqi_service.py`, `cache.py`)
- CPCB India AQI sub-index & category classifier (`decision_engine/classifier.py`)
- Deterministic persona-aware recommendation engine (`decision_engine/rules.py`)
- Deterministic indoor air quality checklist generator (`decision_engine/indoor_advisor.py`)
- Gemini AI integration using `google-genai` SDK + deterministic fallback (`services/gemini_service.py`, `prompts/templates.py`)
- User profile persistence with Firebase Firestore + local JSON fallback (`services/user_service.py`)
- All FastAPI route modules (`api/routes/aqi.py`, `recommendations.py`, `ai.py`, `indoor.py`, `simulator.py`, `users.py`)

---

## 🚧 Remaining To Do

### 1. Verification & Polish
- [ ] Full TypeScript type-check & Vite production build verification (`npm run build`)
- [ ] Full `pytest` suite execution & end-to-end audit

### 2. Automated Backend Tests
- [ ] `backend/tests/test_classifier.py` (CPCB AQI breakpoints, edge cases, None/negative values)
- [ ] `backend/tests/test_rules.py` (Deterministic rules, stale/missing AQI handling)
- [ ] `backend/tests/test_personas.py` (4 personas: Family w/ young child, Motorcycle commuter, Student on public transit, Outdoor worker)
- [ ] `backend/tests/test_api.py` (FastAPI TestClient tests for all endpoints, missing credentials fallback, invalid input)

### 3. Security, Deployment & Documentation
- [ ] Root `.gitignore` & `README.md` (Architecture diagram, setup, PromptWars Challenge 6 docs, AI vs deterministic breakdown)
- [ ] `firestore.rules` for Firebase security
- [ ] Full TypeScript type-check & Vite production build verification (`npm run build`)
- [ ] Full `pytest` suite execution & end-to-end audit
