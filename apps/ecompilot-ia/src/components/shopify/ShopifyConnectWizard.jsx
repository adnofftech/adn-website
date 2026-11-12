import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowRight, Check, Copy, ExternalLink, Loader2, Lock, ShoppingBag, Zap } from 'lucide-react';
import { base44 } from '@/api/base44';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { normalizeDomain } from '@/components/shopify/domain';

const SCOPES = ['read_products', 'write_products', 'read_orders'];

const variants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

/** Wizard de connexion Shopify en trois étapes. */
export function ShopifyConnectWizard({ onConnected }) {
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shop, setShop] = useState(null);

  async function connect() {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('connectShopify', {
        shop_domain: normalizeDomain(domain),
        access_token: token.trim(),
      });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      setShop(data);
      setStep(3);
      confetti({ particleCount: 140, spread: 72, origin: { y: 0.65 }, colors: ['#f5b800', '#ffffff', '#3ecf8e'] });
      onConnected?.(data);
    } catch (err) {
      setError(err?.message || 'La connexion a échoué. Vérifie le domaine et le jeton.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[19px] border border-white/12 bg-gradient-to-b from-[rgba(39,40,40,.94)] to-[rgba(20,21,22,.97)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
        {[1, 2, 3].map((index) => (
          <React.Fragment key={index}>
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${
                step >= index ? 'bg-primary text-primary-foreground' : 'border border-white/15 text-muted-foreground'
              }`}
            >
              {step > index ? <Check className="h-3 w-3" /> : index}
            </span>
            {index < 3 ? (
              <span className={`h-px flex-1 ${step > index ? 'bg-primary/60' : 'bg-white/12'}`} />
            ) : null}
          </React.Fragment>
        ))}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <Step1 onNext={() => setStep(2)} />
            </motion.div>
          ) : null}
          {step === 2 ? (
            <motion.div key="step2" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <Step2
                domain={domain}
                setDomain={setDomain}
                token={token}
                setToken={setToken}
                loading={loading}
                error={error}
                onBack={() => setStep(1)}
                onConnect={connect}
              />
            </motion.div>
          ) : null}
          {step === 3 ? (
            <motion.div key="step3" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <Step3 shop={shop} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Step1({ onNext }) {
  return (
    <div>
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-primary/35 bg-primary/12 text-primary">
        <ShoppingBag className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-cream">Connecte ta boutique Shopify</h2>
      <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
        Tes agents travaillent alors sur tes vrais chiffres, et non sur des exemples. Il te faut trois minutes et aucune
        compétence technique.
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Zap, title: 'Ta santé réelle', text: 'Antoine calcule ton brief sur tes ventes d’hier.' },
          { icon: Check, title: 'Tes marges exactes', text: 'Maxime lit tes prix et tes coûts produit.' },
          { icon: Lock, title: 'Lecture d’abord', text: 'Toute écriture te demande une validation en un clic.' },
        ].map((item) => (
          <li key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <item.icon className="h-4 w-4 text-primary" />
            <p className="mt-2 text-sm font-semibold text-cream">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
          </li>
        ))}
      </ul>

      <Button className="mt-6" onClick={onNext}>
        C’est parti
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function Step2({ domain, setDomain, token, setToken, loading, error, onBack, onConnect }) {
  const [copied, setCopied] = useState(false);
  const normalized = normalizeDomain(domain);
  const tokenLooksValid = token.trim().startsWith('shpat_');
  const ready = Boolean(normalized) && token.trim().length > 10;

  async function copyScopes() {
    try {
      await navigator.clipboard.writeText(SCOPES.join(', '));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* presse-papiers refusé */
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-cream">Crée ton application privée</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Dans l’administration Shopify : <strong className="text-cream">Paramètres → Applications et canaux de vente →
        Développer des applications → Créer une application</strong>. Puis configure les accès Admin API ci-dessous.
      </p>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f7c75]">
            Autorisations à cocher
          </p>
          <button
            type="button"
            onClick={copyScopes}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {SCOPES.map((scope) => (
            <code key={scope} className="rounded-lg bg-black/40 px-2 py-1 font-mono text-xs text-cream/90">
              {scope}
            </code>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div>
          <Label htmlFor="shop-domain">Domaine de ta boutique</Label>
          <Input
            id="shop-domain"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="ma-boutique"
            className="mt-2"
            autoComplete="off"
          />
          <p className="mt-1.5 text-xs text-[#7f7c75]">
            {normalized ? `Sera utilisé : ${normalized}` : 'Le suffixe .myshopify.com est ajouté automatiquement.'}
          </p>
          {normalized ? (
            <a
              href={`https://${normalized}/admin/settings/apps`}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
            >
              Ouvrir mon admin Shopify
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>

        <div>
          <Label htmlFor="shop-token">Jeton d’accès Admin API</Label>
          <Input
            id="shop-token"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="shpat_..."
            className="mt-2 font-mono"
            autoComplete="off"
          />
          <p className="mt-1.5 text-xs text-[#7f7c75]">
            {token.trim()
              ? tokenLooksValid
                ? 'Format reconnu.'
                : 'Un jeton Admin API commence normalement par « shpat_ ».'
              : 'Il s’affiche une seule fois après l’installation de l’application.'}
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-500/35 bg-red-950/40 px-4 py-3 text-sm text-red-100">{error}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={onConnect} disabled={!ready || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {loading ? 'Vérification…' : 'Connecter ma boutique'}
        </Button>
        <Button variant="ghost" onClick={onBack} disabled={loading}>
          Retour
        </Button>
      </div>
    </div>
  );
}

function Step3({ shop }) {
  return (
    <div className="text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-300">
        <Check className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-cream">Ta boutique est connectée</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Tes six agents travaillent maintenant sur tes vraies données.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Info label="Boutique" value={shop?.shop_name} />
        <Info label="Forfait" value={shop?.plan_display_name || '—'} />
        <Info label="Produits" value={shop?.product_count ?? 0} />
      </div>

      <Badge variant="success" className="mt-5">
        Devise {shop?.currency || 'EUR'}
      </Badge>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7f7c75]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-cream">{value}</p>
    </div>
  );
}

export default ShopifyConnectWizard;
