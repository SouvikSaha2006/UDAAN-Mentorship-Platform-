import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, accent = 'royal' }) {
  const accentMap = {
    royal: 'bg-royal-50 text-royal-600 dark:bg-royal-950/60 dark:text-royal-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    navy: 'bg-navy-50 text-navy-700 dark:bg-navy-900/80 dark:text-navy-200',
  };

  return (
    <div className="card-surface p-5 hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">{value}</p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accentMap[accent] || accentMap.royal}`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400">{subtitle}</span>
          {trend && (
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
