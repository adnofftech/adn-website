import React from 'react';
import { cn } from '@/lib/utils';

export const Label = ({ className, ...props }) => (
  <label className={cn('text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground', className)} {...props} />
);

export default Label;
