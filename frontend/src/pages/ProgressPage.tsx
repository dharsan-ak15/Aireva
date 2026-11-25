import { Award, CheckCircle2, Calendar, Leaf } from 'lucide-react';
import { useProgressStore, useRecommendationStore, useIndoorStore } from '../store';
import WeeklyProgressChart from '../components/charts/WeeklyProgressChart';

export default function ProgressPage() {
  const { dailyProgress, getWeekProgress, addProgress } = useProgressStore();
  const recommendations = useRecommendationStore((s) => s.recommendations);
  const checklist = useIndoorStore((s) => s.checklist);

  const todayKey = new Date().toISOString().split('T')[0];
  const completedRecs = recommendations.filter((r) => r.isCompleted).length;
  const completedIndoor = checklist.filter((i) => i.isCompleted).length;
  const weekDays = getWeekProgress();
  const loggedDays = Object.keys(dailyProgress).length;

  const logTodayProgress = () => {
    addProgress(todayKey, {
      date: todayKey,
      recommendationsCount: recommendations.length,
      completedCount: completedRecs,
      sustainableChoices: recommendations.filter((r) => r.isCompleted).map((r) => r.action),
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Today's Routine Actions</p>
              <p className="text-2xl font-bold text-gray-900">
                {completedRecs}/{recommendations.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Indoor Checklist</p>
              <p className="text-2xl font-bold text-gray-900">
                {completedIndoor}/{checklist.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Days Tracked</p>
              <p className="text-2xl font-bold text-gray-900">{loggedDays}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Log Today Action */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">Save Today's Clean-Air Log</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Record your completed actions for {todayKey} to build your weekly progress chart. No fake data is generated.
          </p>
        </div>
        <button
          onClick={logTodayProgress}
          disabled={recommendations.length === 0}
          className="btn-primary text-sm shrink-0"
        >
          Save Today's Progress
        </button>
      </div>

      {/* Weekly Chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Weekly Completion Trend</h3>
        <WeeklyProgressChart data={weekDays} />
      </div>

      {/* Earned Achievements */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-forest-700" />
          <h3 className="font-semibold text-gray-900">Clean-Air Milestones</h3>
        </div>
        {completedRecs === 0 && loggedDays === 0 ? (
          <p className="text-sm text-gray-500">
            Complete actions in your Daily Routine or Indoor Advisor to unlock milestones.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {completedRecs > 0 && (
              <div className="p-3 rounded-xl bg-forest-50 border border-forest-100">
                <p className="font-semibold text-forest-900 text-sm">First Clean-Air Step</p>
                <p className="text-xs text-forest-700 mt-0.5">Completed your first personalized action today.</p>
              </div>
            )}
            {loggedDays >= 1 && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-100">
                <p className="font-semibold text-teal-900 text-sm">Habit Builder</p>
                <p className="text-xs text-teal-700 mt-0.5">Logged {loggedDays} day(s) of air-aware choices.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
