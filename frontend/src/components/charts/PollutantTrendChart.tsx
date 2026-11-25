// ============================================================
// Aireva – Pollutant Trend Chart (Recharts)
// ============================================================
import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { HistoricalReading } from '../../types';
import { getPollutantInfo } from '../../utils';
import { TrendingUp } from 'lucide-react';
import { EmptyState, LoadingSpinner } from '../ui';

interface PollutantTrendChartProps {
  data: HistoricalReading[];
  parameter?: string;
  isLoading: boolean;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const reading = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md px-3 py-2">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function PollutantTrendChart({
  data,
  parameter = 'pm25',
  isLoading,
}: PollutantTrendChartProps) {
  const info = getPollutantInfo(parameter);

  const chartData = useMemo(() => {
    return data.map((r) => ({
      time: formatTime(r.timestamp),
      [info.label]: parseFloat(r.value.toFixed(1)),
    }));
  }, [data, info.label]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-56">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-12 w-12" />}
        title="No historical data available"
        description="Historical readings will appear here once data has been collected for this station."
      />
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-700">
            {info.label} – 48 Hour Trend
          </h4>
          <p className="text-xs text-gray-400">Unit: {info.unit}</p>
        </div>
        <div className="text-xs text-gray-400">Safe limit: {info.safeLimit} {info.unit}</div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={info.safeLimit}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{ value: 'Safe limit', position: 'right', fontSize: 9, fill: '#f59e0b' }}
          />
          <Line
            type="monotone"
            dataKey={info.label}
            stroke="#16653a"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#16653a' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
