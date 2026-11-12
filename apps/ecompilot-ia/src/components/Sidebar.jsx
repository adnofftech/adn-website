import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LogIn, LogOut, Search, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NAV_GROUPS } from '@/lib/navigation';
import { AGENTS_BY_KEY } from '@/lib/agents';
import { useEcomProfile } from '@/lib/useEcomProfile';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

export function Sidebar({ onNavigate, onOpenPalette }) {
  const { isAuthenticated, logout } = useAuth();
  const { niche, isGuest, beginnerMode, updateProfile } = useEcomProfile();
  const [draft, setDraft] = useState(niche || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(niche || '');
  }, [niche]);

  async function saveNiche(event) {
    event.preventDefault();
    const value = draft.trim();
    if (!value || value === niche) return;
    setSaving(true);
    try {
      await updateProfile({ niche: value });
      toast({ title: 'Niche mise à jour', description: `Tes agents travaillent maintenant sur « ${value} ».` });
    } catch {
      toast({ title: 'Enregistrement impossible', description: 'Réessaie dans un instant.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col border-r border-white/10 bg-[#0a0a0b]">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="ta-team__mark">T</span>
        <div>
          <p className="text-sm font-semibold tracking-tight text-cream">Ta Team</p>
          <p className="text-[11px] text-muted-foreground">EcomPilot IA</p>
        </div>
      </div>

      <div className="px-4">
        <button
          type="button"
          onClick={onOpenPalette}
          className="flex w-full items-center gap-2.5 rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-cream"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1">Rechercher un outil</span>
          <kbd className="rounded-md border border-white/14 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </button>
      </div>

      <nav className="ecp-scroll mt-4 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => {
          const agent = AGENTS_BY_KEY[group.agent];
          return (
            <div key={group.agent}>
              <p className="flex items-center gap-2 px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f6c66]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: agent?.color }} />
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/'}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
                            isActive
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-cream/75 hover:bg-white/5 hover:text-cream',
                          )
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-4">
        {isGuest ? (
          <>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f6c66]">Niche de la démo</p>
              <p className="mt-1.5 text-xs leading-relaxed text-cream/80">{niche}</p>
            </div>
            <Link
              to="/register"
              className="block rounded-2xl border border-violet-500/35 bg-violet-500/[0.12] p-3 no-underline transition-colors hover:border-violet-400/60"
            >
              <p className="flex items-center gap-2 text-xs font-semibold text-violet-100">
                <Sparkles className="h-3.5 w-3.5" />
                Crée un compte pour personnaliser ta niche
              </p>
              <p className="mt-1 text-[11px] text-violet-200/70">Tes résultats seront gardés en mémoire.</p>
            </Link>
          </>
        ) : (
          <form onSubmit={saveNiche}>
            <label htmlFor="niche-input" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f6c66]">
              Ta niche
            </label>
            <Input
              id="niche-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ex. : accessoires pour chiens"
              className="mt-1.5 h-9 text-xs"
            />
            <Button
              type="submit"
              variant="violet"
              size="sm"
              className="mt-2 w-full"
              disabled={saving || !draft.trim() || draft.trim() === niche}
            >
              {saving ? 'Enregistrement…' : 'Changer'}
            </Button>
          </form>
        )}

        {beginnerMode ? <Badge variant="muted">Mode débutant</Badge> : null}

        <div className="flex flex-col gap-1 pt-1">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/parametres"
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
                    isActive ? 'bg-white/8 text-cream' : 'text-cream/70 hover:bg-white/5 hover:text-cream',
                  )
                }
              >
                <Settings className="h-4 w-4" />
                Paramètres
              </NavLink>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-cream/70 transition-colors hover:bg-white/5 hover:text-cream"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={onNavigate}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-cream/70 no-underline transition-colors hover:bg-white/5 hover:text-cream"
            >
              <LogIn className="h-4 w-4" />
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
