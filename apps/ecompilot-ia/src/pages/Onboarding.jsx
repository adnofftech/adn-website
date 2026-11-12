import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ImagePlus, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AGENTS } from '@/lib/agents';
import { AgentAvatar } from '@/components/AgentAvatar';
import { useEcomProfile } from '@/lib/useEcomProfile';

const EXAMPLES = [
  'accessoires pour chiens et chats',
  'matériel de randonnée léger',
  'soins de la peau naturels',
  'équipement de cuisine pour petits espaces',
];

/** Écran de démarrage : niche (obligatoire) et photo produit (facultative). */
export function Onboarding() {
  const { updateProfile, isGuest } = useEcomProfile();
  const [niche, setNiche] = useState('');
  const [photo, setPhoto] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setPhoto(file_url);
    } catch {
      setError('L’envoi de la photo a échoué. Tu peux continuer sans.');
    } finally {
      setUploading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    const value = niche.trim();
    if (!value) {
      setError('Indique ta niche pour que tes agents sachent sur quoi travailler.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ niche: value, productPhoto: photo || null });
    } catch {
      setError('L’enregistrement a échoué. Réessaie dans un instant.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ta-team min-h-screen">
      <div className="ta-team__inner flex min-h-screen max-w-[980px] flex-col justify-center py-16">
        <p className="ta-team__eyebrow">
          <span className="ta-team__dot" />
          Bienvenue dans Ta Team
        </p>
        <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-cream md:text-[52px]">
          Sur quoi tes six agents doivent-ils travailler ?
        </h1>
        <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
          Une seule réponse à donner : ta niche. Tout ce que l’application génère ensuite — produits, textes, publicités,
          réponses clients, calculs de marge — sera écrit pour elle.
        </p>

        <div className="mt-7 flex flex-wrap gap-2">
          {AGENTS.map((agent) => (
            <span
              key={agent.key}
              className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] py-1.5 pl-1.5 pr-3.5"
            >
              <AgentAvatar agent={agent} size={26} />
              <span className="text-xs font-semibold text-cream/85">{agent.name}</span>
            </span>
          ))}
        </div>

        <form onSubmit={submit} className="mt-9 rounded-[22px] border border-white/12 bg-white/[0.03] p-6">
          <Label htmlFor="onboarding-niche">Ta niche e-commerce</Label>
          <Input
            id="onboarding-niche"
            value={niche}
            onChange={(event) => setNiche(event.target.value)}
            placeholder="Ex. : accessoires pour chiens et chats"
            className="mt-2 h-12 text-base"
            autoFocus
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setNiche(example)}
                className="rounded-full border border-white/12 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {example}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/10 pt-5">
            {photo ? (
              <img src={photo} alt="" className="h-16 w-16 rounded-2xl border border-white/12 object-cover" />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-2xl border border-dashed border-white/18 text-muted-foreground">
                <ImagePlus className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-cream">Photo de ton produit (facultatif)</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Claire s’en servira pour décrire ton produit dans tes textes et ta fiche.
              </p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" id="onboarding-photo" />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {photo ? 'Changer' : 'Ajouter'}
            </Button>
          </div>

          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" disabled={saving || !niche.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Lancer mon équipe
              <ArrowRight className="h-4 w-4" />
            </Button>
            {isGuest ? (
              <p className="text-xs text-muted-foreground">
                Mode démo : rien n’est enregistré.{' '}
                <Link to="/register" className="font-semibold text-violet-300 underline decoration-violet-400/50">
                  Créer un compte
                </Link>
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;
