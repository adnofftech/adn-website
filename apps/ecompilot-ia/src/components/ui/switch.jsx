import React from 'react';
import { cn } from '@/lib/utils';

export const Switch = ({ checked = false, onCheckedChange, className, id, ...props }) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    onClick={() => onCheckedChange?.(!checked)}
    className={cn(
      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
      checked ? 'border-primary/60 bg-primary/80' : 'border-white/15 bg-white/10',
      className,
    )}
    {...props}
  >
    <span
      className={cn(
        'ml-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-5' : 'translate-x-0',
      )}
    />
  </button>
);

export default Switch;
