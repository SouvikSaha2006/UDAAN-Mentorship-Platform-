import React from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle, Loader2 } from 'lucide-react';

const VARIANT_STYLES = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  info: 'bg-royal-50 text-royal-800 border-royal-200 dark:bg-royal-950/60 dark:text-royal-300 dark:border-royal-800',
  warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  danger: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  violet: 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

export function getStatusVariant(status = '') {
  const s = status.toLowerCase();
  if (['accepted', 'completed', 'approved', 'confirmed', 'submitted', 'active', 'resolved'].includes(s)) {
    return 'success';
  }
  if (['in progress', 'under review', 'scheduled', 'assigned'].includes(s)) {
    return 'info';
  }
  if (['pending', 'pending verification', 'upcoming', 'medium'].includes(s)) {
    return 'warning';
  }
  if (['rejected', 'cancelled', 'high'].includes(s)) {
    return 'danger';
  }
  return 'neutral';
}

export default function Badge({ children, variant, status, withIcon = false, className = '' }) {
  const resolvedVariant = variant || (status ? getStatusVariant(status) : 'neutral');

  const Icon =
    resolvedVariant === 'success'
      ? CheckCircle2
      : resolvedVariant === 'warning'
      ? Clock
      : resolvedVariant === 'danger'
      ? XCircle
      : resolvedVariant === 'info'
      ? Loader2
      : AlertCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        VARIANT_STYLES[resolvedVariant] || VARIANT_STYLES.neutral
      } ${className}`}
    >
      {withIcon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}
