import { useState } from 'react';
import { Save, RotateCcw, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserStore } from '../store';
import { saveProfile } from '../services/api';
import type { Budget, CommuteMethod, CookingFuel, UserCategory } from '../types';

export default function ProfilePage() {
  const { profile, updateProfile, clearProfile } = useUserStore();

  const [name, setName] = useState(profile?.name || '');
  const [city, setCity] = useState(profile?.location?.city || '');
  const [stateName, setStateName] = useState(profile?.location?.state || '');
  const [category, setCategory] = useState<UserCategory>(profile?.category || 'family');
  const [commuteMethod, setCommuteMethod] = useState<CommuteMethod>(
    profile?.lifestyle?.commuteMethod || 'public_transport'
  );
  const [cookingFuel, setCookingFuel] = useState<CookingFuel>(
    profile?.lifestyle?.cookingFuel || 'lpg'
  );
  const [hasAirPurifier, setHasAirPurifier] = useState<boolean>(
    profile?.lifestyle?.hasAirPurifier ?? false
  );
  const [hasYoungChildren, setHasYoungChildren] = useState<boolean>(
    profile?.household?.hasYoungChildren ?? false
  );
  const [hasRespiratory, setHasRespiratory] = useState<boolean>(
    profile?.household?.hasRespiratoryConditions ?? false
  );
  const [budget, setBudget] = useState<Budget>(profile?.lifestyle?.budget || 'medium');
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      toast.error('City is required');
      return;
    }

    const updated = {
      ...profile,
      name: name.trim() || undefined,
      category,
      location: {
        ...profile.location,
        city: city.trim(),
        state: stateName.trim(),
      },
      household: {
        ...profile.household,
        hasYoungChildren,
        hasRespiratoryConditions: hasRespiratory,
      },
      lifestyle: {
        ...profile.lifestyle,
        commuteMethod,
        cookingFuel,
        hasAirPurifier,
        budget,
      },
    };

    updateProfile(updated);
    setSaving(true);
    try {
      await saveProfile(updated);
      toast.success('Profile updated & synced');
    } catch {
      toast.success('Profile saved locally (backend offline)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
            <UserCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">Profile & Preferences</h2>
            <p className="text-xs text-gray-500">Update your household and lifestyle details anytime</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Optional"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Profile Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as UserCategory)}
                className="select-field text-sm"
              >
                <option value="family">Family</option>
                <option value="working_professional">Working Professional</option>
                <option value="student">Student</option>
                <option value="senior_citizen">Senior Citizen</option>
                <option value="outdoor_worker">Outdoor Worker</option>
                <option value="community_organizer">Community Organizer</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">City *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">State</label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Commute Method</label>
              <select
                value={commuteMethod}
                onChange={(e) => setCommuteMethod(e.target.value as CommuteMethod)}
                className="select-field text-sm"
              >
                <option value="public_transport">Public Transport</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="car">Car</option>
                <option value="auto_rickshaw">Auto Rickshaw</option>
                <option value="cycling">Cycling</option>
                <option value="walking">Walking</option>
                <option value="work_from_home">Work from Home</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Cooking Fuel</label>
              <select
                value={cookingFuel}
                onChange={(e) => setCookingFuel(e.target.value as CookingFuel)}
                className="select-field text-sm"
              >
                <option value="lpg">LPG</option>
                <option value="png">PNG (Piped Gas)</option>
                <option value="electric">Electric / Induction</option>
                <option value="biomass">Biomass / Wood</option>
                <option value="kerosene">Kerosene</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Improvement Budget</label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value as Budget)}
                className="select-field text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={hasYoungChildren}
                onChange={(e) => setHasYoungChildren(e.target.checked)}
                className="rounded text-forest-700"
              />
              Household has young children
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={hasRespiratory}
                onChange={(e) => setHasRespiratory(e.target.checked)}
                className="rounded text-forest-700"
              />
              Self-reported respiratory sensitivities
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAirPurifier}
                onChange={(e) => setHasAirPurifier(e.target.checked)}
                className="rounded text-forest-700"
              />
              Air purifier available at home
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={clearProfile}
              className="btn-ghost text-red-600 hover:bg-red-50 text-sm flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Re-run Onboarding
            </button>
            <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
