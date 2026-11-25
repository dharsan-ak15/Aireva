import { useState } from 'react';
import { FlaskConical, ArrowRight, RefreshCw, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserStore } from '../store';
import { runSimulation } from '../services/api';
import type { CommuteMethod, ExerciseHabit, SimulatorResult } from '../types';

const COMMUTE_OPTIONS: { value: CommuteMethod; label: string }[] = [
  { value: 'car', label: 'Private Car' },
  { value: 'motorcycle', label: 'Motorcycle / Scooter' },
  { value: 'auto_rickshaw', label: 'Auto Rickshaw' },
  { value: 'public_transport', label: 'Metro / Bus / Train' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'walking', label: 'Walking' },
  { value: 'work_from_home', label: 'Work from Home' },
];

const EXERCISE_OPTIONS: { value: ExerciseHabit; label: string }[] = [
  { value: 'moderate_outdoor', label: 'Outdoor Exercise' },
  { value: 'moderate_indoor', label: 'Indoor Exercise' },
  { value: 'none', label: 'No Regular Exercise' },
];

export default function SimulatorPage() {
  const profile = useUserStore((s) => s.profile);

  const [curCommute, setCurCommute] = useState<CommuteMethod>(
    profile?.lifestyle?.commuteMethod || 'car'
  );
  const [curDuration, setCurDuration] = useState<number>(
    profile?.lifestyle?.commuteDurationMinutes ?? 40
  );
  const [curExercise, setCurExercise] = useState<ExerciseHabit>(
    profile?.lifestyle?.exerciseHabit || 'moderate_outdoor'
  );
  const [curVent, setCurVent] = useState<'early_morning' | 'avoid_peak' | 'evening' | 'windows_closed'>('early_morning');

  const [altCommute, setAltCommute] = useState<CommuteMethod>('public_transport');
  const [altDuration, setAltDuration] = useState<number>(40);
  const [altExercise, setAltExercise] = useState<ExerciseHabit>('moderate_indoor');
  const [altVent, setAltVent] = useState<'early_morning' | 'avoid_peak' | 'evening' | 'windows_closed'>('avoid_peak');

  const [result, setResult] = useState<SimulatorResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompare = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const res = await runSimulation(
        {
          id: 'current',
          name: 'Current Routine',
          commuteMethod: curCommute,
          commuteDurationMinutes: curDuration,
          exerciseHabit: curExercise,
          ventilationTiming: curVent,
        },
        {
          id: 'alternative',
          name: 'Alternative Routine',
          commuteMethod: altCommute,
          commuteDurationMinutes: altDuration,
          exerciseHabit: altExercise,
          ventilationTiming: altVent,
        },
        profile
      );
      setResult(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">What-If Lifestyle Simulator</h2>
            <p className="text-xs text-gray-500">
              Compare your current daily habits against cleaner, lower-exposure alternatives
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Builders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Current Routine</h3>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Commute Method</label>
            <select
              className="select-field text-sm"
              value={curCommute}
              onChange={(e) => setCurCommute(e.target.value as CommuteMethod)}
            >
              {COMMUTE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              One-way Commute Duration: {curDuration} min
            </label>
            <input
              type="range"
              min={0}
              max={120}
              step={5}
              value={curDuration}
              onChange={(e) => setCurDuration(Number(e.target.value))}
              className="w-full accent-forest-700"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Exercise Location</label>
            <select
              className="select-field text-sm"
              value={curExercise}
              onChange={(e) => setCurExercise(e.target.value as ExerciseHabit)}
            >
              {EXERCISE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Ventilation Timing</label>
            <select
              className="select-field text-sm"
              value={curVent}
              onChange={(e) => setCurVent(e.target.value as any)}
            >
              <option value="early_morning">Early Morning</option>
              <option value="avoid_peak">Avoid Peak Traffic Hours</option>
              <option value="evening">Evening</option>
              <option value="windows_closed">Windows Closed</option>
            </select>
          </div>
        </div>

        {/* Alternative */}
        <div className="card p-5 space-y-4 border-forest-200 bg-forest-50/20">
          <h3 className="font-semibold text-forest-900 border-b border-forest-100 pb-2">Alternative Routine</h3>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Commute Method</label>
            <select
              className="select-field text-sm"
              value={altCommute}
              onChange={(e) => setAltCommute(e.target.value as CommuteMethod)}
            >
              {COMMUTE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              One-way Commute Duration: {altDuration} min
            </label>
            <input
              type="range"
              min={0}
              max={120}
              step={5}
              value={altDuration}
              onChange={(e) => setAltDuration(Number(e.target.value))}
              className="w-full accent-forest-700"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Exercise Location</label>
            <select
              className="select-field text-sm"
              value={altExercise}
              onChange={(e) => setAltExercise(e.target.value as ExerciseHabit)}
            >
              {EXERCISE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Ventilation Timing</label>
            <select
              className="select-field text-sm"
              value={altVent}
              onChange={(e) => setAltVent(e.target.value as any)}
            >
              <option value="avoid_peak">Avoid Peak Traffic Hours</option>
              <option value="early_morning">Early Morning</option>
              <option value="evening">Evening</option>
              <option value="windows_closed">Windows Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={handleCompare} disabled={isLoading} className="btn-primary flex items-center gap-2">
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Compare Routines
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg">Comparison Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-forest-50 rounded-xl p-4 border border-forest-100">
              <p className="text-xs font-medium text-forest-700">Estimated Transport CO2 Difference</p>
              <p className="text-2xl font-bold text-forest-900 mt-1">
                {result.co2Difference !== undefined ? `${result.co2Difference} kg/day` : 'N/A'}
              </p>
              <p className="text-xs text-forest-700 mt-1">{result.environmentalImpact}</p>
            </div>
            <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
              <p className="text-xs font-medium text-sky-700">Personal Exposure</p>
              <p className="text-xs text-gray-700 mt-2 leading-relaxed">{result.exposureComparison}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-medium text-gray-600">Cost & Convenience</p>
              <p className="text-xs text-gray-700 mt-2">{result.costComparison}</p>
              <p className="text-xs text-gray-500 mt-1">
                Convenience: {result.currentScenario.convenienceScore}/10 vs {result.alternativeScenario.convenienceScore}/10
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{result.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
}
