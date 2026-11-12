import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { base44 } from '@/api/base44';
import { PageHeader } from '@/components/PageHeader';
import { ShopifySection } from '@/components/shopify/ShopifySection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import { useEcomProfile } from '@/lib/useEcomProfile';

export default function Settings() {
  const { niche, productPhoto, beginnerMode, updateProfile, isGuest, user } = useEcomProfile();
  const [draftNiche, setDraftNiche] = useState(niche || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setDraftNiche(niche || '');
  }, [niche]);

  async function saveNiche(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ niche: draftNiche.trim() });
      toast({ title: 'Niche enregistrée', description: `Tes agents travaillent sur « ${draftNiche.trim()} ».` });
    } catch {
      toast({ title: 'Enregistrement impossible', description: 'Réessaie dans un instant.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleBeginner(value) {
    try {
      await updateProfile({ beginnerMode: value });
    } catch {
      toast({ title: 'Enregistrement impossible', variant: 'destructive' });
    }
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPrivateFile({ file });
      await updateProfile({ productPhoto: file_url });
      toast({ title: 'Photo enregistrée' });
    } catch {
      toast({ title: 'Envoi impossible', description: 'Réessaie avec une image plus légère.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        icon={SettingsIcon}
        title="Paramètres"
        badge={null}
        subtitle="Ta niche, ton produit, ton niveau de vocabulaire et la connexion de ta boutique Shopify."
      />

      {isGuest ? (
        <p className="rounded-2xl border border-violet-500/30 bg-violet-500/[0.08] px-4 py-3 text-sm text-violet-100">
          Tu es en mode démo : crée un compte pour enregistrer ta niche, ta photo produit et connecter ta boutique.
        </p>
      ) : null}

      <section className="rounded-[19px] border border-white/12 bg-white/[0.02] p-5">
        <h2 className="text-lg font-semibold tracking-tight text-cream">Profil</h2>
        {user?.email ? <p className="mt-1 text-xs text-muted-foreground">{user.email}</p> : null}

        <form onSubmit={saveNiche} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <Label htmlFor="settings-niche">Ta niche e-commerce</Label>
            <Input
              id="settings-niche"
              value={draftNiche}
              onChange={(event) => setDraftNiche(event.target.value)}
              placeholder="Ex. : accessoires de voyage pour chiens"
              className="mt-2"
              disabled={isGuest}
            />
          </div>
          <Button type="submit" variant="violet" disabled={isGuest || saving || !draftNiche.trim() || draftNiche.trim() === niche}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
          <div>
            <p className="text-sm font-semibold text-cream">Mode débutant</p>
            <p className="mt-1 max-w-[60ch] text-xs leading-relaxed text-muted-foreground">
              Vocabulaire simple, aucun jargon non expliqué, ton encourageant. Désactive-le pour des réponses plus
              techniques.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {beginnerMode ? <Badge variant="muted">Activé</Badge> : null}
            <Switch checked={beginnerMode} onCheckedChange={toggleBeginner} id="beginner-mode" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/10 pt-5">
          {productPhoto ? (
            <img src={productPhoto} alt="Ton produit" className="h-20 w-20 rounded-2xl border border-white/12 object-cover" />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-2xl border border-dashed border-white/18 text-muted-foreground">
              <ImagePlus className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-cream">Photo du produit principal</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Utilisée comme contexte par Claire pour les textes publicitaires et la fiche produit.
            </p>
          </div>
          <input ref={fileRef} id="settings-photo" type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={isGuest || uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {productPhoto ? 'Changer' : 'Ajouter'}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight text-cream">Boutique Shopify</h2>
        <ShopifySection />
        <details className="mt-4 rounded-[19px] border border-white/12 bg-white/[0.02] p-5">
          <summary className="cursor-pointer text-sm font-semibold text-cream">
            Comment créer l’application Shopify (Admin API)
          </summary>
          <ol className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>1. Dans ton administration Shopify : Paramètres → Applications et canaux de vente.</li>
            <li>2. Clique sur « Développer des applications », puis « Créer une application ».</li>
            <li>3. Donne-lui un nom (par exemple « EcomPilot IA »), puis ouvre « Configurer les accès Admin API ».</li>
            <li>
              4. Coche les autorisations <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs">read_products</code>,{' '}
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs">write_products</code> et{' '}
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs">read_orders</code>, puis enregistre.
            </li>
            <li>5. Installe l’application, puis copie le jeton d’accès Admin API (il commence par « shpat_ »).</li>
            <li>6. Colle le domaine de ta boutique et ce jeton dans le wizard ci-dessus.</li>
          </ol>
          <p className="mt-3 text-xs text-[#7f7c75]">
            Le jeton reste stocké sur ton compte et n’est utilisé que pour lire ta boutique. Toute écriture (par exemple
            la création d’un produit) te demande une validation explicite.
          </p>
        </details>
      </section>
    </div>
  );
}
