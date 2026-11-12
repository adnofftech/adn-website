import React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Bouton-lien vers un site externe (nouvel onglet). */
export function LinkButton({ href, children, className }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xl border border-white/14 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-cream/90 transition-colors hover:border-primary/45 hover:text-primary',
        className,
      )}
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

export default LinkButton;
