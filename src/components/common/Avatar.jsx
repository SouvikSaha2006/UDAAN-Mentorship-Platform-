import React from 'react';
import { getInitials } from '../../utils/helpers';

export default function Avatar({ name, color = 'from-royal-600 to-violet-600', size = 'md' }) {
  const sizeClass =
    size === 'sm'
      ? 'w-8 h-8 text-xs'
      : size === 'lg'
      ? 'w-14 h-14 text-lg'
      : size === 'xl'
      ? 'w-20 h-20 text-2xl'
      : 'w-10 h-10 text-sm';

  return (
    <div
      role="img"
      aria-label={`${name} avatar`}
      className={`${sizeClass} rounded-full bg-gradient-to-br ${color} text-white font-bold flex items-center justify-center shrink-0 shadow-sm select-none`}
    >
      {getInitials(name)}
    </div>
  );
}
