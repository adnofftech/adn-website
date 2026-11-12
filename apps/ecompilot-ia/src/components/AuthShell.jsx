import React from 'react';
import { Link } from 'react-router-dom';

/** Cadre commun aux pages d’authentification. */
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="ta-team flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-7 flex items-center justify-center gap-3 no-underline">
          <span className="ta-team__mark">T</span>
          <span className="text-lg font-semibold tracking-tight text-cream">Ta Team</span>
        </Link>

        <div className="rounded-[22px] border border-white/12 bg-gradient-to-b from-[rgba(39,40,40,.94)] to-[rgba(20,21,22,.97)] p-7">
          <h1 className="text-xl font-semibold tracking-tight text-cream">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>

        {footer ? <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}

        <p className="mt-6 text-center text-xs text-[#6f6c66]">
          Tu peux aussi{' '}
          <Link to="/" className="font-semibold text-primary underline decoration-primary/40">
            essayer l’application en mode démo
          </Link>
          , sans créer de compte.
        </p>
      </div>
    </div>
  );
}

export default AuthShell;
