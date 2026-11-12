import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * En-tête de page standard : icône encadrée, titre, badge « IA »,
 * sous-titre, accroche optionnelle et emplacement d’actions à droite.
 */
export function PageHeader({ icon: Icon, title, subtitle, tagline, color = '#f5b800', badge = 'IA', actions, className }) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-5', className)}>
      <div className="flex min-w-0 items-start gap-4">
        {Icon ? (
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border"
            style={{
              borderColor: `${color}59`,
              background: `linear-gradient(150deg, ${color}26, rgba(255,255,255,.02))`,
              color,
            }}
          >
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-cream md:text-[30px]">{title}</h1>
            {badge ? <Badge>{badge}</Badge> : null}
          </div>
          {subtitle ? <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
          {tagline ? <p className="mt-1 text-xs italic text-[#7f7c75]">{tagline}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export default PageHeader;
