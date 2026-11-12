import React from 'react';
import { cn } from '@/lib/utils';

const VARIANTS = {
  default: 'border-primary/35 bg-primary/12 text-primary',
  muted: 'border-white/14 bg-white/5 text-muted-foreground',
  success: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300',
  warning: 'border-orange-500/35 bg-orange-500/10 text-orange-300',
  danger: 'border-red-500/35 bg-red-500/10 text-red-300',
  violet: 'border-violet-500/35 bg-violet-500/12 text-violet-300',
};

export const Badge = ({ className, variant = 'default', ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]',
      VARIANTS[variant] || VARIANTS.default,
      className,
    )}
    {...props}
  />
);

export default Badge;
