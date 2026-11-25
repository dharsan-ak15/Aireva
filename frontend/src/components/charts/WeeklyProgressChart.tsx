// ============================================================
// Aireva – Weekly Progress Bar Chart (Recharts)
// ============================================================
import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { DailyProgress } from '../../types';
import { BarChart2 } from 'lucide-react';
import { EmptyState } from '../ui';

interface WeeklyProgressChartProps {
  data: DailyProgress[];
}

function dayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short' });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md px-3 py-2">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-forest-700">{payload[0].value}% complete</p>
    </div>
  );
}

export default function WeeklyProgressChart({ data }: WeeklyProgressChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      day: dayLabel(d.date),
      completion:
        d.recommendationsCount > 0
          ? Math.round((d.completedCount / d.recommendationsCount) * 100)
          : 0,
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<BarChart2 className="h-10 w-10" />}
        title="No weekly data yet"
        description="Complete daily recommendations to track your weekly progress."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
        <Bar dataKey="completion" radius={[6, 6, 0, 0]} maxBarSize={36}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.completion >= 80 ? '#16653a' : entry.completion >= 50 ? '#5cb870' : '#bbf7d0'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
