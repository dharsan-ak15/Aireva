// ============================================================
// Aireva – Reusable UI Primitives
// ============================================================
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils';

// ─── LoadingSpinner ───────────────────────────────────────────
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  };
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-forest-700 border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

// ─── EmptyState ───────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="text-gray-300 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
      <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
      <p className="text-sm text-red-600 font-medium mb-1">Something went wrong</p>
      <p className="text-xs text-gray-500 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────
interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

const BADGE_VARIANTS = {
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-700',
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        BADGE_VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────
interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  color?: string;
}

export function ProgressBar({ value, className, color }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('w-full bg-gray-100 rounded-full h-2 overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-300', color ?? 'bg-forest-700')}
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, className, hoverable }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-gray-100',
        hoverable && 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
}

// ─── Stat ─────────────────────────────────────────────────────
interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { direction: 'up' | 'down' | 'neutral'; label: string };
  icon?: React.ReactNode;
}

export function Stat({ label, value, unit, trend, icon }: StatProps) {
  const trendColor =
    trend?.direction === 'up'
      ? 'text-red-500'
      : trend?.direction === 'down'
      ? 'text-emerald-600'
      : 'text-gray-500';

  return (
    <div className="flex items-start gap-3">
      {icon && <div className="mt-0.5 text-forest-700">{icon}</div>}
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </div>
        {trend && <p className={cn('text-xs mt-0.5', trendColor)}>{trend.label}</p>}
      </div>
    </div>
  );
}
