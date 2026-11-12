import React from 'react';
import { cn } from '@/lib/utils';

const VARIANTS = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_28px_rgba(245,184,0,.22)]',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-border bg-transparent hover:bg-white/5',
  ghost: 'hover:bg-white/5',
  violet: 'bg-violet-600 text-white hover:bg-violet-500 shadow-[0_8px_28px_rgba(139,92,246,.28)]',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
};

const SIZES = {
  default: 'h-10 px-4 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
};

export const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const classes = cn(
      'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:pointer-events-none disabled:opacity-50',
      VARIANTS[variant] || VARIANTS.default,
      SIZES[size] || SIZES.default,
      className,
    );
    if (asChild && React.isValidElement(props.children)) {
      const child = props.children;
      return React.cloneElement(child, { className: cn(classes, child.props.className), ref });
    }
    return <button ref={ref} className={classes} {...props} />;
  },
);
Button.displayName = 'Button';

export default Button;
