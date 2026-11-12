import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Avatar d’agent : dessin minimaliste en SVG, fond sombre, liseré coloré.
 * Chaque agent a une silhouette légèrement différente (coiffure, accessoire).
 */
export function AgentAvatar({ agent, size = 56, className }) {
  const { color = '#f5b800', key = 'antoine', name = '' } = agent || {};
  const id = `grad-${key}`;

  return (
    <span
      className={cn('ta-team__avatar', className)}
      style={{ width: size, height: size, borderColor: `${color}8c`, background: '#161718' }}
      aria-hidden="true"
      title={name}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} role="presentation">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill={`url(#${id})`} />
        {/* épaules */}
        <path d="M11 64c0-12 9.4-19 21-19s21 7 21 19" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        {/* tête */}
        <circle cx="32" cy="27" r="12" fill="none" stroke={color} strokeWidth="2.4" />
        {/* yeux */}
        <circle cx="27.5" cy="26" r="1.5" fill={color} />
        <circle cx="36.5" cy="26" r="1.5" fill={color} />
        {/* bouche */}
        <path d="M27.5 32.5c1.6 1.7 3.1 2.5 4.5 2.5s2.9-.8 4.5-2.5" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        {/* signe distinctif par agent */}
        {key === 'antoine' && <path d="M21 20c3-4 7-6 11-6s8 2 11 6" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />}
        {key === 'remi' && <path d="M20 19l6 3M44 19l-6 3M32 13v4" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />}
        {key === 'claire' && (
          <path d="M20 28c-1-9 4-15 12-15s13 6 12 15M20 28c0 6 1 9 3 11M44 28c0 6-1 9-3 11" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        )}
        {key === 'samuel' && (
          <path d="M20 26v4a3 3 0 003 3M44 26v4a3 3 0 01-3 3M20 26a12 12 0 0124 0" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        )}
        {key === 'camille' && (
          <path d="M22 18c4-5 16-5 20 0M24 14c0-3 2-5 4-5M40 14c0-3-2-5-4-5" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        )}
        {key === 'maxime' && (
          <path d="M22 21h20M24 17h16" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        )}
      </svg>
    </span>
  );
}

export default AgentAvatar;
