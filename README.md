# Aireva

Aireva is an urban air-quality assistant for Indian cities. It combines live pollutant readings, health guidance, and practical clean-air actions for households and commuters.

## Features

- Live AQI and pollutant measurements from OpenAQ, with Open-Meteo CAMS fallback
- Seven-day hourly PM2.5 trends and locally archived observations
- Personalized recommendations and daily routine planning
- Indoor air-quality checklist and sustainable-lifestyle comparisons
- AI assistant with deterministic fallback, plus a what-if simulator
- Progress tracking, community guidance, and editable household profiles

## Project layout

- `backend/api/routes`: FastAPI endpoints
- `backend/services`: external data clients, AQI logic, and persistence
- `backend/decision_engine`: AQI classification and deterministic advice
- `backend/models` and `backend/schemas`: domain and API data contracts
- `frontend/src/pages`: application screens
- `frontend/src/components`: shared UI, charts, onboarding, and layout
- `frontend/src/services`: frontend API client

## Run locally

Start the backend in one terminal:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Start the frontend in another terminal:

```powershell
cd frontend
npm ci
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173`. FastAPI documentation is available at `http://localhost:8000/docs`.

OpenAQ, Gemini, and Firebase credentials are optional. Without an OpenAQ API key, AQI data uses Open-Meteo CAMS where available. Gemini and Firebase features use their configured fallbacks when credentials are absent.

## Checks

```powershell
cd frontend
npm run type-check
npm run lint
npm run build
```

```powershell
cd backend
python -m pytest -q
```