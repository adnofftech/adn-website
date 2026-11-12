import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, Loader2, Send, X } from 'lucide-react';
import { base44 } from '@/api/base44';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pageLabel } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const WELCOME = {
  role: 'assistant',
  content:
    'Bonjour ! Pose ta question, même si elle te paraît toute bête. Je réponds en fonction de la page où tu te trouves.',
};

/** Bouton flottant « Une question ? » (violet) et son panneau de discussion. */
export function HelpButton() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([WELCOME]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [history, open, loading]);

  async function ask(event) {
    event?.preventDefault();
    const text = question.trim();
    if (!text || loading) return;

    setHistory((prev) => [...prev, { role: 'user', content: text }]);
    setQuestion('');
    setLoading(true);
    setError(null);

    try {
      const res = await base44.functions.invoke('helpAssistant', {
        question: text,
        currentPage: pageLabel(pathname),
      });
      const answer = res?.data?.answer || res?.answer;
      setHistory((prev) => [...prev, { role: 'assistant', content: answer || 'Je n’ai pas su répondre à celle-ci.' }]);
    } catch (err) {
      setError(err?.message || 'La réponse n’est pas arrivée. Réessaie dans un instant.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[100] inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(139,92,246,.4)] transition-transform hover:-translate-y-0.5 hover:bg-violet-500"
        aria-expanded={open}
      >
        {open ? <X className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
        Une question ?
      </button>

      {open ? (
        <section
          className="fixed bottom-20 right-5 z-[100] flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-[22px] border border-violet-500/35 bg-[#141516] shadow-2xl"
          aria-label="Aide"
        >
          <header className="border-b border-white/10 bg-violet-600/15 px-4 py-3">
            <p className="text-sm font-semibold text-cream">Une question ?</p>
            <p className="text-xs text-muted-foreground">Page : {pageLabel(pathname)}</p>
          </header>

          <div className="ecp-scroll max-h-[46vh] space-y-3 overflow-y-auto p-4">
            {history.map((entry, index) => (
              <div
                key={index}
                className={cn(
                  'max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  entry.role === 'user'
                    ? 'ml-auto bg-violet-600/25 text-cream'
                    : 'border border-white/10 bg-black/30 text-cream/90',
                )}
              >
                {entry.content}
              </div>
            ))}
            {loading ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Je cherche la réponse la plus simple…
              </p>
            ) : null}
            {error ? <p className="text-xs text-red-300">{error}</p> : null}
            <div ref={endRef} />
          </div>

          <form onSubmit={ask} className="flex items-center gap-2 border-t border-white/10 p-3">
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ex. : comment je trouve mon premier produit ?"
            />
            <Button type="submit" variant="violet" size="icon" disabled={loading || !question.trim()} aria-label="Envoyer">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>
      ) : null}
    </>
  );
}

export default HelpButton;
