import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { NAV_FLAT } from '@/lib/navigation';
import { cn } from '@/lib/utils';

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Recherche d’outil (⌘K / Ctrl+K). */
export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return NAV_FLAT;
    return NAV_FLAT.filter(
      (item) => normalize(item.label).includes(q) || normalize(item.group).includes(q) || normalize(item.path).includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setIndex(0);
    const id = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  if (!open) return null;

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      onClose();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    }
    if (event.key === 'Enter' && results[index]) {
      event.preventDefault();
      navigate(results[index].path);
      onClose();
    }
  }

  let lastGroup = null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Rechercher un outil"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[22px] border border-white/14 bg-[#141516] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un outil, un agent…"
            className="w-full bg-transparent text-sm text-cream outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded-md border border-white/14 px-1.5 py-0.5 text-[10px] text-muted-foreground">Esc</kbd>
        </div>

        <div className="ecp-scroll max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Aucun outil ne correspond à « {query} ».
            </p>
          ) : (
            results.map((item, i) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              const Icon = item.icon;
              return (
                <React.Fragment key={item.path}>
                  {showGroup ? (
                    <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f6c66]">
                      {item.group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                      i === index ? 'bg-primary/14 text-cream' : 'text-cream/80 hover:bg-white/5',
                    )}
                  >
                    {Icon ? <Icon className="h-4 w-4 shrink-0 text-primary" /> : null}
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {i === index ? <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
