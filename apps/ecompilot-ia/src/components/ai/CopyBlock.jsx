import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Bloc de texte copiable en un clic. */
export function CopyBlock({ label, text, children, className, tone = 'default' }) {
  const [copied, setCopied] = useState(false);
  const value = typeof text === 'string' ? text : '';

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* presse-papiers refusé : l’utilisateur peut sélectionner le texte */
    }
  }

  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        tone === 'accent' ? 'border-primary/30 bg-primary/[0.06]' : 'border-white/10 bg-white/[0.02]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {label ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f7c75]">{label}</p>
        ) : (
          <span />
        )}
        {value ? (
          <button
            type="button"
            onClick={copy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/12 px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        ) : null}
      </div>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-cream/90">{children ?? value}</div>
    </div>
  );
}

export default CopyBlock;
