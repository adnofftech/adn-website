import React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-[19px] border border-white/12 bg-gradient-to-b from-[rgba(39,40,40,.94)] to-[rgba(20,21,22,.97)] text-card-foreground',
      className,
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />
);

export const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('text-lg font-semibold tracking-tight', className)} {...props} />
);

export const CardDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props} />
);

export const CardContent = ({ className, ...props }) => <div className={cn('p-5 pt-0', className)} {...props} />;

export const CardFooter = ({ className, ...props }) => (
  <div className={cn('flex items-center p-5 pt-0', className)} {...props} />
);
