// ============================================================
// Aireva – Complete Multi-Step Onboarding Flow
// ============================================================
import React, { useState, useCallback } from 'react';
import {
  Wind,
  MapPin,
  Users,
  Heart,
  Bike,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Locate,
} from 'lucide-react';
import type {
  UserCategory,
  CommuteMethod,
  ExerciseHabit,
  CookingFuel,
  Budget,
  UserProfile,
  OnboardingStep,
} from '../../types';
import { useUserStore } from '../../store';
import { generateUserId } from '../../utils';
import { cn } from '../../utils';

// ─── Constants ────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];

const CATEGORIES: { value: UserCategory; label: string; icon: string; desc: string }[] = [
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧', desc: 'Managing a household with dependents' },
  { value: 'working_professional', label: 'Working Professional', icon: '💼', desc: 'Commuting to work daily' },
  { value: 'student', label: 'Student', icon: '📚', desc: 'School, college or university student' },
  { value: 'senior_citizen', label: 'Senior Citizen', icon: '🧓', desc: 'Aged 60+ with health considerations' },
  { value: 'outdoor_worker', label: 'Outdoor Worker', icon: '🏗️', desc: 'Work primarily happens outdoors' },
  { value: 'community_organizer', label: 'Community Organizer', icon: '🤝', desc: 'Leading local environmental initiatives' },
];

const COMMUTE_OPTIONS: { value: CommuteMethod; label: string; icon: string }[] = [
  { value: 'walking', label: 'Walking', icon: '🚶' },
  { value: 'cycling', label: 'Cycling', icon: '🚴' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'public_transport', label: 'Public Transport', icon: '🚌' },
  { value: 'auto_rickshaw', label: 'Auto Rickshaw', icon: '🛺' },
  { value: 'work_from_home', label: 'Work from Home', icon: '🏠' },
];

const EXERCISE_OPTIONS: { value: ExerciseHabit; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'light_indoor', label: 'Light Indoor' },
  { value: 'moderate_indoor', label: 'Moderate Indoor' },
  { value: 'light_outdoor', label: 'Light Outdoor' },
  { value: 'moderate_outdoor', label: 'Moderate Outdoor' },
  { value: 'intense_outdoor', label: 'Intense Outdoor' },
];

const COOKING_FUELS: { value: CookingFuel; label: string }[] = [
  { value: 'lpg', label: 'LPG' },
  { value: 'png', label: 'PNG (Piped Gas)' },
  { value: 'electric', label: 'Electric' },
  { value: 'biomass', label: 'Biomass / Wood' },
  { value: 'kerosene', label: 'Kerosene' },
  { value: 'induction', label: 'Induction' },
];

const STEPS: OnboardingStep[] = ['welcome', 'location', 'category', 'household', 'lifestyle', 'complete'];

// ─── Shared Form State ────────────────────────────────────────
interface FormState {
  name: string;
  country: string;
  state: string;
  city: string;
  locality: string;
  category: UserCategory | '';
  numberOfMembers: number;
  hasYoungChildren: boolean;
  childrenAgeGroups: string[];
  hasOlderAdults: boolean;
  hasRespiratoryConditions: boolean;
  commuteMethod: CommuteMethod | '';
  commuteDurationMinutes: number;
  exerciseHabit: ExerciseHabit | '';
  cookingFuel: CookingFuel | '';
  hasKitchenExhaust: boolean;
  hasAirPurifier: boolean;
  budget: Budget | '';
}

const DEFAULT_FORM: FormState = {
  name: '',
  country: 'India',
  state: '',
  city: '',
  locality: '',
  category: '',
  numberOfMembers: 2,
  hasYoungChildren: false,
  childrenAgeGroups: [],
  hasOlderAdults: false,
  hasRespiratoryConditions: false,
  commuteMethod: '',
  commuteDurationMinutes: 30,
  exerciseHabit: '',
  cookingFuel: '',
  hasKitchenExhaust: false,
  hasAirPurifier: false,
  budget: '',
};

// ─── Progress Indicator ───────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i < current ? 'bg-forest-700 w-6' : i === current ? 'bg-forest-700 w-8' : 'bg-gray-200 w-4'
          )}
        />
      ))}
    </div>
  );
}

// ─── Toggle Component ─────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer select-none py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-forest-700' : 'bg-gray-200'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform duration-200',
            checked && 'translate-x-5'
          )}
        />
      </div>
    </label>
  );
}

// ─── STEP: Welcome ────────────────────────────────────────────
function WelcomeStep({ onNext, form, setForm }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center px-6">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-forest-700 mb-6">
          <Wind className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-2">Aireva</h1>
        <p className="text-lg font-medium text-forest-700 mb-4">
          Know Your Air. Protect Your People. Live Sustainably.
        </p>
        <p className="text-gray-500 max-w-sm leading-relaxed">
          Aireva gives you real-time air quality data for Indian cities, personalised health
          recommendations for your household, and actionable steps toward cleaner living — all
          powered by OpenAQ data and Gemini AI.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-xs">
        {[
          { icon: '📊', label: 'Live AQI' },
          { icon: '🤖', label: 'AI Advice' },
          { icon: '🌱', label: 'Eco Tips' },
        ].map((f) => (
          <div key={f.label} className="flex flex-col items-center bg-gray-50 rounded-2xl p-3">
            <span className="text-2xl mb-1">{f.icon}</span>
            <span className="text-xs text-gray-600 font-medium">{f.label}</span>
          </div>
        ))}
      </div>
      <div className="mb-4 w-full max-w-xs">
        <label className="block text-sm font-medium text-gray-700 mb-1">Your name (optional)</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Priya"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
        />
      </div>
      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold px-8 py-3 rounded-2xl transition-colors"
      >
        Get Started <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── STEP: Location ───────────────────────────────────────────
function LocationStep({ onNext, onBack, form, setForm, errors }: StepProps) {
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          // We store coordinates; reverse geocode is best-effort on backend
          city: f.city || 'My Location',
        }));
        setLocating(false);
      },
      () => {
        setLocError('Location permission denied. Please enter your city manually.');
        setLocating(false);
      }
    );
  };

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="text-center mb-6">
        <MapPin className="h-10 w-10 text-forest-700 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-900">Where are you?</h2>
        <p className="text-sm text-gray-500 mt-1">We use this to fetch local air quality data.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <select
          value={form.country}
          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
        >
          <option value="India">India</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
        <select
          value={form.state}
          onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
        >
          <option value="">Select state…</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          placeholder="e.g. Mumbai"
          className={cn(
            'w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700',
            errors?.city ? 'border-red-400' : 'border-gray-200'
          )}
        />
        {errors?.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Locality (optional)</label>
        <input
          type="text"
          value={form.locality}
          onChange={(e) => setForm((f) => ({ ...f, locality: e.target.value }))}
          placeholder="e.g. Bandra West"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
        />
      </div>

      <button
        onClick={handleGeolocate}
        disabled={locating}
        className="w-full inline-flex items-center justify-center gap-2 border border-forest-700 text-forest-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-forest-50 transition-colors disabled:opacity-60"
      >
        {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
        Use my location
      </button>
      {locError && <p className="text-xs text-amber-600 text-center">{locError}</p>}

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ─── STEP: Category ───────────────────────────────────────────
function CategoryStep({ onNext, onBack, form, setForm }: StepProps) {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <Users className="h-10 w-10 text-forest-700 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-900">What describes you best?</h2>
        <p className="text-sm text-gray-500 mt-1">This helps tailor recommendations for your situation.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
            className={cn(
              'flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all',
              form.category === cat.value
                ? 'border-forest-700 bg-forest-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            )}
          >
            <span className="text-2xl mb-2">{cat.icon}</span>
            <span className="text-sm font-semibold text-gray-900">{cat.label}</span>
            <span className="text-xs text-gray-500 mt-0.5">{cat.desc}</span>
          </button>
        ))}
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!form.category} />
    </div>
  );
}

// ─── STEP: Household ─────────────────────────────────────────
function HouseholdStep({ onNext, onBack, form, setForm }: StepProps) {
  const AGE_GROUPS = [
    { value: 'infant', label: 'Infant (0–2 yrs)' },
    { value: 'toddler', label: 'Toddler (2–5 yrs)' },
    { value: 'school_age', label: 'School age (5–12 yrs)' },
  ];

  const toggleAgeGroup = (v: string) => {
    setForm((f) => ({
      ...f,
      childrenAgeGroups: f.childrenAgeGroups.includes(v)
        ? f.childrenAgeGroups.filter((g) => g !== v)
        : [...f.childrenAgeGroups, v],
    }));
  };

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="text-center mb-6">
        <Heart className="h-10 w-10 text-forest-700 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-900">Your Household</h2>
        <p className="text-sm text-gray-500 mt-1">Help us protect everyone at home.</p>
      </div>

      {/* Members slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Family members: <span className="font-bold text-forest-700">{form.numberOfMembers}</span>
        </label>
        <input
          type="range"
          min={1}
          max={15}
          value={form.numberOfMembers}
          onChange={(e) => setForm((f) => ({ ...f, numberOfMembers: parseInt(e.target.value) }))}
          className="w-full accent-forest-700"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1</span><span>15</span></div>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-3">
        <Toggle
          checked={form.hasYoungChildren}
          onChange={(v) => setForm((f) => ({ ...f, hasYoungChildren: v, childrenAgeGroups: v ? f.childrenAgeGroups : [] }))}
          label="Has young children (< 12 years)?"
        />
        {form.hasYoungChildren && (
          <div className="pl-4 space-y-2">
            <p className="text-xs text-gray-500 font-medium">Age groups present:</p>
            {AGE_GROUPS.map((ag) => (
              <label key={ag.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.childrenAgeGroups.includes(ag.value)}
                  onChange={() => toggleAgeGroup(ag.value)}
                  className="accent-forest-700"
                />
                <span className="text-sm text-gray-700">{ag.label}</span>
              </label>
            ))}
          </div>
        )}
        <Toggle
          checked={form.hasOlderAdults}
          onChange={(v) => setForm((f) => ({ ...f, hasOlderAdults: v }))}
          label="Has older adults (> 60 years)?"
        />
        <Toggle
          checked={form.hasRespiratoryConditions}
          onChange={(v) => setForm((f) => ({ ...f, hasRespiratoryConditions: v }))}
          label="Anyone has respiratory sensitivities?"
        />
        {form.hasRespiratoryConditions && (
          <p className="text-xs text-amber-600 pl-1">
            Note: This is for personalisation only — not a medical diagnosis.
          </p>
        )}
      </div>

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ─── STEP: Lifestyle ─────────────────────────────────────────
function LifestyleStep({ onNext, onBack, form, setForm }: StepProps) {
  return (
    <div className="w-full max-w-md space-y-5">
      <div className="text-center mb-4">
        <Bike className="h-10 w-10 text-forest-700 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-900">Your Lifestyle</h2>
        <p className="text-sm text-gray-500 mt-1">Personalise your daily air quality plan.</p>
      </div>

      {/* Commute method */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">How do you commute?</p>
        <div className="grid grid-cols-4 gap-2">
          {COMMUTE_OPTIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => setForm((f) => ({ ...f, commuteMethod: c.value }))}
              className={cn(
                'flex flex-col items-center p-2 rounded-xl border-2 transition-all',
                form.commuteMethod === c.value
                  ? 'border-forest-700 bg-forest-50'
                  : 'border-gray-100 hover:border-gray-200'
              )}
            >
              <span className="text-xl">{c.icon}</span>
              <span className="text-xs text-gray-600 mt-1 text-center leading-tight">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Daily commute: <span className="font-bold text-forest-700">{form.commuteDurationMinutes} min</span>
        </label>
        <input
          type="range"
          min={0}
          max={180}
          step={5}
          value={form.commuteDurationMinutes}
          onChange={(e) => setForm((f) => ({ ...f, commuteDurationMinutes: parseInt(e.target.value) }))}
          className="w-full accent-forest-700"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0 min</span><span>3 hours</span></div>
      </div>

      {/* Exercise */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Exercise habit</p>
        <div className="grid grid-cols-2 gap-2">
          {EXERCISE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setForm((f) => ({ ...f, exerciseHabit: opt.value }))}
              className={cn(
                'text-left px-3 py-2 rounded-xl border-2 text-sm transition-all',
                form.exerciseHabit === opt.value
                  ? 'border-forest-700 bg-forest-50 text-forest-800 font-medium'
                  : 'border-gray-100 text-gray-700 hover:border-gray-200'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cooking fuel */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cooking fuel</label>
        <select
          value={form.cookingFuel}
          onChange={(e) => setForm((f) => ({ ...f, cookingFuel: e.target.value as CookingFuel }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
        >
          <option value="">Select…</option>
          {COOKING_FUELS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Toggles */}
      <div className="space-y-1 border-t border-gray-100 pt-3">
        <Toggle
          checked={form.hasKitchenExhaust}
          onChange={(v) => setForm((f) => ({ ...f, hasKitchenExhaust: v }))}
          label="Has kitchen exhaust / chimney?"
        />
        <Toggle
          checked={form.hasAirPurifier}
          onChange={(v) => setForm((f) => ({ ...f, hasAirPurifier: v }))}
          label="Has air purifier?"
        />
      </div>

      {/* Budget */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Budget for improvements</p>
        <div className="grid grid-cols-3 gap-2">
          {(['low', 'medium', 'high'] as Budget[]).map((b) => (
            <button
              key={b}
              onClick={() => setForm((f) => ({ ...f, budget: b }))}
              className={cn(
                'py-2 rounded-xl border-2 text-sm font-medium capitalize transition-all',
                form.budget === b
                  ? 'border-forest-700 bg-forest-50 text-forest-800'
                  : 'border-gray-100 text-gray-600 hover:border-gray-200'
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Complete Setup" />
    </div>
  );
}

// ─── STEP: Complete ───────────────────────────────────────────
function CompleteStep({ form, onFinish, isSubmitting }: { form: FormState; onFinish: () => void; isSubmitting: boolean }) {
  const catInfo = CATEGORIES.find((c) => c.value === form.category);
  return (
    <div className="flex flex-col items-center text-center px-6">
      <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
        <CheckCircle className="h-10 w-10 text-emerald-600" />
      </div>
      <h2 className="text-3xl font-black text-gray-900 mb-2">You're all set!</h2>
      <p className="text-gray-500 mb-6 max-w-xs">
        Here's a summary of your profile. You can update this anytime in settings.
      </p>

      <div className="bg-gray-50 rounded-2xl p-5 text-left w-full max-w-xs space-y-3 mb-8">
        {form.name && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-900">{form.name}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Location</span>
          <span className="font-medium text-gray-900">{form.city}{form.state ? `, ${form.state}` : ''}</span>
        </div>
        {catInfo && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Category</span>
            <span className="font-medium text-gray-900">{catInfo.icon} {catInfo.label}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Household size</span>
          <span className="font-medium text-gray-900">{form.numberOfMembers} members</span>
        </div>
        {form.commuteMethod && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Commute</span>
            <span className="font-medium text-gray-900 capitalize">
              {COMMUTE_OPTIONS.find((c) => c.value === form.commuteMethod)?.label}
            </span>
          </div>
        )}
        {form.budget && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Budget</span>
            <span className="font-medium text-gray-900 capitalize">{form.budget}</span>
          </div>
        )}
      </div>

      <button
        onClick={onFinish}
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold px-8 py-3 rounded-2xl transition-colors disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Start Exploring
        {!isSubmitting && <ChevronRight className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Nav Buttons ──────────────────────────────────────────────
interface NavButtonsProps {
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}

function NavButtons({ onBack, onNext, nextDisabled, nextLabel = 'Continue' }: NavButtonsProps) {
  return (
    <div className="flex gap-3 pt-2">
      {onBack && (
        <button
          onClick={onBack}
          className="flex-1 inline-flex items-center justify-center gap-1 border border-gray-200 text-gray-600 font-medium px-5 py-2.5 rounded-2xl hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className={cn(
          'flex-1 inline-flex items-center justify-center gap-1 bg-forest-700 hover:bg-forest-800 text-white font-semibold px-5 py-2.5 rounded-2xl transition-colors',
          nextDisabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {nextLabel} <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Shared Step Props ────────────────────────────────────────
interface StepProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onNext: () => void;
  onBack?: () => void;
  errors?: Record<string, string>;
}

// ─── Main Onboarding Flow ─────────────────────────────────────
export default function OnboardingFlow() {
  const setProfile = useUserStore((s) => s.setProfile);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepIndex = STEPS.indexOf(currentStep);

  const validate = useCallback(
    (step: OnboardingStep): boolean => {
      const newErrors: Record<string, string> = {};
      if (step === 'location' && !form.city.trim()) {
        newErrors.city = 'City is required.';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [form]
  );

  const goNext = useCallback(() => {
    if (!validate(currentStep)) return;
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  }, [currentStep, stepIndex, validate]);

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1]);
    }
  }, [stepIndex]);

  const handleFinish = useCallback(async () => {
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const profile: UserProfile = {
      id: generateUserId(),
      name: form.name || undefined,
      category: (form.category || 'family') as UserCategory,
      location: {
        country: form.country,
        state: form.state,
        city: form.city,
        locality: form.locality || undefined,
      },
      household: {
        numberOfMembers: form.numberOfMembers,
        hasYoungChildren: form.hasYoungChildren,
        childrenAgeGroups: form.childrenAgeGroups,
        hasOlderAdults: form.hasOlderAdults,
        hasRespiratoryConditions: form.hasRespiratoryConditions,
      },
      lifestyle: {
        commuteMethod: (form.commuteMethod || 'public_transport') as CommuteMethod,
        commuteDurationMinutes: form.commuteDurationMinutes,
        exerciseHabit: (form.exerciseHabit || 'none') as ExerciseHabit,
        cookingFuel: (form.cookingFuel || 'lpg') as CookingFuel,
        hasKitchenExhaust: form.hasKitchenExhaust,
        hasAirPurifier: form.hasAirPurifier,
        budget: (form.budget || 'medium') as Budget,
      },
      createdAt: now,
      updatedAt: now,
      onboardingComplete: true,
    };
    setProfile(profile);
    setIsSubmitting(false);
  }, [form, setProfile]);

  // Stagger key so transitions are obvious
  const stepKey = currentStep;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50 flex flex-col items-center justify-center px-4 py-10">
      {currentStep !== 'welcome' && currentStep !== 'complete' && (
        <div className="mb-8">
          <StepIndicator current={stepIndex} total={STEPS.length} />
        </div>
      )}

      <div
        key={stepKey}
        className="w-full max-w-lg animate-in fade-in slide-in-from-right-4 duration-200 flex flex-col items-center"
      >
        {currentStep === 'welcome' && (
          <WelcomeStep form={form} setForm={setForm} onNext={goNext} />
        )}
        {currentStep === 'location' && (
          <LocationStep form={form} setForm={setForm} onNext={goNext} onBack={goBack} errors={errors} />
        )}
        {currentStep === 'category' && (
          <CategoryStep form={form} setForm={setForm} onNext={goNext} onBack={goBack} />
        )}
        {currentStep === 'household' && (
          <HouseholdStep form={form} setForm={setForm} onNext={goNext} onBack={goBack} />
        )}
        {currentStep === 'lifestyle' && (
          <LifestyleStep form={form} setForm={setForm} onNext={goNext} onBack={goBack} />
        )}
        {currentStep === 'complete' && (
          <CompleteStep form={form} onFinish={handleFinish} isSubmitting={isSubmitting} />
        )}
      </div>
    </div>
  );
}
