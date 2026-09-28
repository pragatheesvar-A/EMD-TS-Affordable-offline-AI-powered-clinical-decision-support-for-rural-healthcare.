import React from 'react';
import type { RiskLevel } from '../../types';

export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 card-shadow ${padded ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-start gap-2">{action}</div>}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants: Record<string, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  };
  const sizes: Record<string, string> = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  };
  return (
    <button
      className={`rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const riskColors: Record<RiskLevel, string> = {
  LOW: 'bg-risk-low-bg text-risk-low border-risk-low/20',
  MODERATE: 'bg-risk-moderate-bg text-risk-moderate border-risk-moderate/20',
  HIGH: 'bg-risk-high-bg text-risk-high border-risk-high/20',
};

const riskLabels: Record<RiskLevel, string> = {
  LOW: 'Low Priority',
  MODERATE: 'Moderate Priority',
  HIGH: 'High Priority',
};

export function RiskBadge({ level, className = '' }: { level: RiskLevel; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${riskColors[level]} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          level === 'HIGH' ? 'bg-risk-high' : level === 'MODERATE' ? 'bg-risk-moderate' : 'bg-risk-low'
        }`}
      />
      {riskLabels[level]}
    </span>
  );
}

export function Badge({
  children,
  color = 'slate',
  className = '',
}: {
  children: React.ReactNode;
  color?: 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'purple';
  className?: string;
}) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-violet-50 text-violet-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}

export function StatTile({
  label,
  value,
  icon,
  tint = 'blue',
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tint?: 'blue' | 'green' | 'amber' | 'red';
}) {
  const tints: Record<string, string> = {
    blue: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{value}</p>
        </div>
        {icon && <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tints[tint]}`}>{icon}</div>}
      </div>
    </Card>
  );
}

export function EmptyState({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16 text-slate-400">
      {icon && <div className="flex justify-center mb-3 opacity-40">{icon}</div>}
      <p className="font-medium text-slate-500">{title}</p>
      {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500';

export function VerifiedPill({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">✓ Verified</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold">✗ Failed</span>
  );
}
