import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44';
import { Image } from '@/components/ui/image';
import { AgentAvatar } from '@/components/AgentAvatar';
import { HealthRing } from '@/components/HealthRing';
import { NextStepBanner } from '@/components/NextStepBanner';
import { AGENTS } from '@/lib/agents';
import { useEcomProfile } from '@/lib/useEcomProfile';
import { formatMoney } from '@/lib/utils';
import heroArt from '@/assets/hero-team.svg';
import buildingArt from '@/assets/building-blocks.svg';

export default function Home() {
  const { niche, isGuest } = useEcomProfile();
  const [stats, setStats] = useState(null);
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let shopifyStats = null;
    try {
      const res = await base44.functions.invoke('getShopifyDailyStats', {});
      shopifyStats = res?.data || res;
      setStats(shopifyStats);
    } catch {
      setStats(null);
    }

    try {
      const res = await base44.functions.invoke('generateDailyPlan', {
        seed: Date.now(),
        shopifyStats,
      });
      setBrief(res?.data || res);
    } catch (err) {
      setError(err?.message || 'Le brief n’a pas pu être généré.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const connected = Boolean(stats?.connected);
  const hasRealStats = connected && !stats?.needScopes;

  return (
    <div className="ta-team">
      {/* Topbar */}
      <header className="ta-team__topbar">
        <div className="ta-team__brand">
          <span className="ta-team__mark">T</span>
          <span>Ta Team</span>
          <span className="ta-team__crumb">· Dashboard d’accueil</span>
        </div>
        <button type="button" className="ta-team__refresh" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </header>

      <div className="ta-team__inner">
        {/* Hero */}
        <section className="ta-team__hero">
          <div className="ta-team__hero-media">
            <Image src={heroArt} alt="" width={1600} height={900} priority />
          </div>
          <div>
            <p className="ta-team__eyebrow">
              <span className="ta-team__dot" />
              Équipe d’agents IA
            </p>
            <h1 className="ta-team__title">Six assistants IA créés pour votre boutique.</h1>
            <p className="ta-team__lead">
              Antoine, Rémi, Claire, Samuel, Camille et Maxime travaillent ensemble sur ta boutique.
              Spécialisé pour ta niche <strong>« {niche} »</strong> : chaque texte, chaque produit et chaque calcul est
              écrit pour elle. Tu n’as qu’à suivre l’étape suivante.
            </p>
          </div>
          <div className="ta-team__orbit" aria-hidden="true">
            <svg viewBox="0 0 220 220">
              <circle cx="110" cy="110" r="86" fill="none" stroke="rgba(245,184,0,.22)" strokeWidth="1.4" strokeDasharray="6 10" />
              <circle cx="110" cy="110" r="58" fill="none" stroke="rgba(245,184,0,.16)" strokeWidth="1.2" />
              <circle cx="110" cy="24" r="7" fill="#f5b800" />
              <circle cx="196" cy="110" r="5" fill="#5fae9a" />
              <circle cx="110" cy="196" r="5" fill="#d06a96" />
              <circle cx="24" cy="110" r="5" fill="#5d97c9" />
            </svg>
          </div>
        </section>

        {/* Parcours guidé */}
        <NextStepBanner />

        {/* Stats Shopify */}
        {hasRealStats ? (
          <section className="ta-team__stats">
            <article className="ta-team__stat">
              <p className="ta-team__stat-label">Chiffre d’affaires d’hier</p>
              <p className="ta-team__stat-value">{formatMoney(stats.yesterday_revenue, stats.currency)}</p>
              <p className="ta-team__stat-sub">Commandes payées du {stats.date}</p>
            </article>
            <article className="ta-team__stat">
              <p className="ta-team__stat-label">Commandes d’hier</p>
              <p className="ta-team__stat-value">{stats.yesterday_orders ?? 0}</p>
              <p className="ta-team__stat-sub">
                {stats.yesterday_orders
                  ? `Panier moyen ${formatMoney(
                      Number(stats.yesterday_revenue || 0) / Number(stats.yesterday_orders),
                      stats.currency,
                    )}`
                  : 'Aucune commande sur la journée'}
              </p>
            </article>
            <article className="ta-team__stat">
              <p className="ta-team__stat-label">Produit en tête</p>
              <p className="ta-team__stat-value" style={{ fontSize: 22 }}>
                {stats.top_products?.[0]?.title || '—'}
              </p>
              <p className="ta-team__stat-sub">
                {stats.top_products?.[0]
                  ? `${stats.top_products[0].quantity} vendu(s) · ${formatMoney(
                      stats.top_products[0].revenue,
                      stats.currency,
                    )}`
                  : 'Pas encore de vente à classer'}
              </p>
            </article>
          </section>
        ) : null}

        {/* Les six assistants */}
        <section className="ta-team__section">
          <div className="ta-team__section-head">
            <div>
              <h2 className="ta-team__section-title">Les six assistants</h2>
              <p className="ta-team__section-sub">
                Chacun a son métier et ses outils. Clique sur un assistant pour entrer dans son espace de travail.
              </p>
            </div>
          </div>

          <div className="ta-team__cards">
            {AGENTS.map((agent) => (
              <Link key={agent.key} to={agent.entry} className="ta-team__card">
                <span className="ta-team__card-rail" style={{ background: agent.color }} />
                <span className="ta-team__card-num">{agent.num}</span>
                <AgentAvatar agent={agent} />
                <span className="ta-team__badge">{agent.badge}</span>
                <h3 className="ta-team__card-name">{agent.name}</h3>
                <p className="ta-team__card-role" style={{ color: agent.color }}>
                  {agent.role}
                </p>
                <p className="ta-team__card-desc">{agent.description}</p>
                <span className="ta-team__card-foot">
                  <span>Équipe {agent.team}</span>
                  <span className="ta-team__arrow">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Brief du Stratège */}
        <section className="ta-team__brief">
          <div className="ta-team__section-head">
            <div>
              <h2 className="ta-team__section-title">Le brief du Stratège</h2>
              <p className="ta-team__section-sub">
                Antoine relit ta situation chaque jour et te donne les trois actions qui comptent le plus.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="ta-team__loading">
              <span className="ta-team__spinner" />
              <p>Le Stratège prépare ton brief…</p>
            </div>
          ) : error ? (
            <div className="ta-team__panel">
              <p className="ta-team__panel-title">Le brief n’a pas pu être généré</p>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <button type="button" className="ta-team__refresh mt-4" onClick={load}>
                <RefreshCw className="h-3.5 w-3.5" />
                Réessayer
              </button>
            </div>
          ) : brief ? (
            <div className="ta-team__brief-grid">
              <div className="ta-team__panel">
                <p className="ta-team__panel-title">
                  {hasRealStats ? 'Santé de ta boutique' : 'Potentiel de démarrage'}
                </p>
                <div className="ta-team__health">
                  <HealthRing score={brief.healthScore} />
                  <p className="ta-team__health-note">{brief.healthExplanation}</p>
                  {!hasRealStats ? (
                    <p className="ta-team__health-hint">
                      Sans données réelles — connecte Shopify pour mesurer ta vraie santé.
                    </p>
                  ) : null}
                </div>
                {brief.topPriority ? (
                  <div className="ta-team__priority">
                    <p className="ta-team__priority-label">Priorité n° 1</p>
                    <p className="ta-team__priority-text">{brief.topPriority}</p>
                  </div>
                ) : null}
              </div>

              <div className="ta-team__actions">
                {(brief.actions || []).map((action, index) => (
                  <article key={index} className="ta-team__action">
                    <div className="ta-team__action-head">
                      <span className="ta-team__action-num">{String(index + 1).padStart(2, '0')}</span>
                      <h3 className="ta-team__action-title">{action.title}</h3>
                    </div>
                    <div className="ta-team__action-grid">
                      <div>
                        <p className="ta-team__action-label">Pourquoi</p>
                        <p className="ta-team__action-body">{action.why}</p>
                      </div>
                      <div>
                        <p className="ta-team__action-label">Comment faire</p>
                        <p className="ta-team__action-body">{action.how}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* Building blocks */}
        <section className="ta-team__building">
          <div>
            <h2 className="ta-team__section-title">Ta boutique se construit brique par brique</h2>
            <p className="ta-team__section-sub">
              Aucune journée ne ressemble à la précédente, mais chacune laisse quelque chose derrière elle : un produit
              validé, une fiche réécrite, une publicité qui tourne, une marge enfin claire. Tes agents gardent la trace
              de chaque résultat et reprennent là où tu t’es arrêté.
            </p>
            <div className="ta-team__blocks">
              <div>
                <p className="ta-team__block-num">06</p>
                <p className="ta-team__block-text">assistants spécialisés, un par métier de la boutique</p>
              </div>
              <div>
                <p className="ta-team__block-num">01</p>
                <p className="ta-team__block-text">équipe coordonnée qui se transmet ton travail</p>
              </div>
              <div>
                <p className="ta-team__block-num">∞</p>
                <p className="ta-team__block-text">possibilités, une seule niche : la tienne</p>
              </div>
            </div>
          </div>
          <div className="ta-team__building-media">
            <Image src={buildingArt} alt="" width={900} height={700} />
          </div>
        </section>

        {/* CTA */}
        <section className="ta-team__cta">
          <div>
            <p className="ta-team__cta-title">Découvrir l’équipe</p>
            <p className="ta-team__cta-sub">
              {isGuest
                ? 'Tu es en mode démo : explore librement, tes résultats ne sont pas conservés.'
                : 'Commence par la feuille de route d’Antoine : tes premiers 1 000 €, étape par étape.'}
            </p>
          </div>
          <Link to="/roadmap" className="ta-team__cta-btn">
            Commencer avec Antoine
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
