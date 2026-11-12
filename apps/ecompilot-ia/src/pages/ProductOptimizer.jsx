import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Package } from 'lucide-react';
import { base44 } from '@/api/base44';
import { ToolShell } from '@/components/ai/ToolShell';
import { CopyBlock } from '@/components/ai/CopyBlock';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import { useEcomProfile } from '@/lib/useEcomProfile';

export default function ProductOptimizer() {
  const { productPhoto, updateProfile, isGuest } = useEcomProfile();
  const [photo, setPhoto] = useState(productPhoto || '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setPhoto(file_url);
      if (!isGuest) await updateProfile({ productPhoto: file_url });
      toast({ title: 'Photo ajoutée', description: 'Claire va l’analyser avec ta fiche produit.' });
    } catch {
      toast({ title: 'Envoi impossible', description: 'Réessaie avec une image plus légère.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <ToolShell
      toolKey="/optimiseur-produit"
      agentKey="claire"
      icon={Package}
      title="Optimiseur produit"
      subtitle="La fiche produit complète : titre, accroche, description longue, bénéfices, caractéristiques, questions fréquentes, SEO, garantie et bouton d’achat."
      fn="optimizeProduct"
      cta="Optimiser ma fiche produit"
      loadingMessage="Claire rédige ta fiche produit complète…"
      fields={[{ name: 'productName', label: 'Nom du produit (facultatif)', wide: true, placeholder: 'Laisse vide pour partir de la photo' }]}
      buildPayload={(values) => ({ ...values, imageUrl: photo || null })}
      render={(data) => (
        <div className="flex flex-col gap-5">
          {data.imageFeedback?.length ? (
            <section className="rounded-[19px] border border-primary/25 bg-primary/[0.06] p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Avis sur ta photo</h2>
              <ul className="mt-3 space-y-2 text-sm text-cream/90">
                {data.imageFeedback.map((item, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.title ? <CopyBlock label="Titre de la fiche" text={data.title} tone="accent" /> : null}
          {data.shortDescription ? <CopyBlock label="Accroche courte" text={data.shortDescription} /> : null}
          {data.description ? <CopyBlock label="Description longue" text={data.description} /> : null}

          {data.bullets?.length ? (
            <CopyBlock label="Bénéfices" text={data.bullets.join('\n')}>
              <ul className="space-y-2">
                {data.bullets.map((item, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CopyBlock>
          ) : null}

          {data.features?.length ? (
            <CopyBlock label="Caractéristiques" text={data.features.join('\n')}>
              <dl className="grid gap-2 sm:grid-cols-2">
                {data.features.map((item, index) => {
                  const [label, ...rest] = String(item).split(':');
                  return (
                    <div key={index} className="rounded-xl border border-white/10 px-3 py-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7f7c75]">{label}</dt>
                      <dd className="mt-0.5 text-sm">{rest.join(':').trim()}</dd>
                    </div>
                  );
                })}
              </dl>
            </CopyBlock>
          ) : null}

          {data.faqs?.length ? (
            <section>
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7f7c75]">
                Questions fréquentes
              </h2>
              <div className="flex flex-col gap-2">
                {data.faqs.map((faq, index) => (
                  <CopyBlock key={index} label={faq.question} text={`${faq.question}\n${faq.reponse}`}>
                    {faq.reponse}
                  </CopyBlock>
                ))}
              </div>
            </section>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            {data.seoTitle ? (
              <CopyBlock label={`Titre SEO (${data.seoTitle.length} caractères)`} text={data.seoTitle} />
            ) : null}
            {data.seoDescription ? (
              <CopyBlock label={`Description SEO (${data.seoDescription.length} caractères)`} text={data.seoDescription} />
            ) : null}
            {data.guarantee ? <CopyBlock label="Garantie" text={data.guarantee} /> : null}
            {data.cta ? <CopyBlock label="Bouton d’achat" text={data.cta} tone="accent" /> : null}
          </div>
        </div>
      )}
    >
      <section className="flex flex-wrap items-center gap-4 rounded-[19px] border border-white/12 bg-white/[0.02] p-5">
        {photo ? (
          <img
            src={photo}
            alt="Ton produit"
            className="h-24 w-24 rounded-2xl border border-white/12 object-cover"
          />
        ) : (
          <span className="grid h-24 w-24 place-items-center rounded-2xl border border-dashed border-white/18 text-muted-foreground">
            <ImagePlus className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-cream">Photo du produit</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Claire décrit ce qu’elle voit, note le cadrage et la lumière, puis rédige la fiche à partir de l’image.
          </p>
          {photo ? <Badge variant="success" className="mt-2">Photo prête</Badge> : null}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" id="product-photo" />
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {photo ? 'Changer la photo' : 'Ajouter une photo'}
        </Button>
      </section>
    </ToolShell>
  );
}
