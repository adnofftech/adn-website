import React, { useEffect, useState } from 'react';
import { CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT = 'ecp:toast';

export function toast({ title, description, variant = 'default' }) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { id: Date.now() + Math.random(), title, description, variant } }));
}

export function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onToast = (e) => {
      const item = e.detail;
      setItems((prev) => [...prev, item]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== item.id)), 4600);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  if (!items.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[120] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur',
            item.variant === 'destructive'
              ? 'border-red-500/40 bg-red-950/80 text-red-100'
              : 'border-primary/35 bg-[rgba(20,21,22,.94)] text-cream',
          )}
          role="status"
        >
          {item.variant === 'destructive' ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          )}
          <div className="min-w-0 flex-1">
            {item.title ? <p className="text-sm font-semibold">{item.title}</p> : null}
            {item.description ? <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
            className="text-muted-foreground transition-colors hover:text-cream"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default Toaster;
