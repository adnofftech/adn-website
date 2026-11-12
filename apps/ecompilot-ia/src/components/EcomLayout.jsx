import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Search, X } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { HelpButton } from '@/components/HelpButton';
import { Onboarding } from '@/pages/Onboarding';
import { useEcomProfile } from '@/lib/useEcomProfile';

export function EcomLayout() {
  const { pathname } = useLocation();
  const { isOnboarded, loading } = useEcomProfile();
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);

  // Raccourci ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPalette((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0e10]">
        <span className="ta-team__spinner" />
      </div>
    );
  }

  if (!isOnboarded) return <Onboarding />;

  const isHome = pathname === '/';

  return (
    <div className="min-h-screen bg-[#0d0e10] text-cream">
      {/* Barre mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0d0e10]/92 px-4 py-3 backdrop-blur md:hidden">
        <button type="button" onClick={() => setDrawer(true)} aria-label="Ouvrir le menu" className="p-1.5">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="ta-team__mark" style={{ width: 26, height: 26, borderRadius: 9, fontSize: 13 }}>
            T
          </span>
          <span className="text-sm font-semibold">Ta Team</span>
        </div>
        <button
          type="button"
          onClick={() => setPalette(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 px-2.5 py-1.5 text-xs text-muted-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          Outils
        </button>
      </header>

      <div className="md:flex">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-screen w-[278px] shrink-0 md:block">
          <Sidebar onOpenPalette={() => setPalette(true)} />
        </aside>

        {/* Tiroir mobile */}
        {drawer ? (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 left-0 w-[86vw] max-w-[320px]">
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Fermer le menu"
                className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-cream/70"
              >
                <X className="h-5 w-5" />
              </button>
              <Sidebar onNavigate={() => setDrawer(false)} onOpenPalette={() => setPalette(true)} />
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          {isHome ? (
            <Outlet />
          ) : (
            <div className="mx-auto max-w-[1100px] px-5 py-8 md:px-9 md:py-11">
              <Outlet />
            </div>
          )}
        </main>
      </div>

      <HelpButton />
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}

export default EcomLayout;
