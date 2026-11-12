import React from 'react';

function ringColor(score) {
  if (score >= 80) return '#3ecf8e';
  if (score >= 60) return '#f5b800';
  if (score >= 40) return '#e89657';
  return '#e06c6c';
}

/** Anneau de santé : couleur et remplissage selon le score. */
export function HealthRing({ score = 0, size = 148 }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const color = ringColor(value);

  return (
    <div className="ta-team__ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 148 148" aria-hidden="true">
        <circle cx="74" cy="74" r={radius} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="10" />
        <circle
          cx="74"
          cy="74"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <span className="ta-team__ring-value" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export default HealthRing;
