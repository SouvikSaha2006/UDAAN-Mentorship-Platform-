import React from 'react';
import { Link } from 'react-router-dom';

export default function UdaanLogo({ to = '/', showTagline = false, light = false, size = 'md' }) {
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const titleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  const content = (
    <span className="inline-flex items-center gap-2.5 group">
      <span
        className={`${iconSize} rounded-xl bg-gradient-to-br from-navy-800 via-royal-600 to-violet-600 flex items-center justify-center shadow-sm shrink-0`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 32" className="w-5 h-5 text-white" fill="none">
          <path
            d="M5 21C9.5 19.5 13 15 16 7C19 15 22.5 19.5 27 21C22.5 22.2 19 21.5 16 18.5C13 21.5 9.5 22.2 5 21Z"
            fill="currentColor"
            fillOpacity="0.95"
          />
          <circle cx="16" cy="24" r="2.2" fill="#FDE68A" />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span
          className={`${titleSize} font-extrabold tracking-tight ${
            light ? 'text-white' : 'text-navy-900 dark:text-white'
          }`}
        >
          UDAAN
        </span>
        {showTagline && (
          <span
            className={`text-[11px] font-medium ${
              light ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Empowering Abilities. Enabling Futures.
          </span>
        )}
      </span>
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-500 rounded-xl">
      {content}
    </Link>
  );
}
