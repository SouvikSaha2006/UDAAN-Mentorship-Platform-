import React from 'react';

export default function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-20 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse"
        />
      ))}
    </div>
  );
}
