import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { base44 } from '@/api/base44';
import { AgentAvatar } from '@/components/AgentAvatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { getAgent } from '@/lib/agents';
import { cn } from '@/lib/utils';

/**
 * Conversation contextuelle avec un agent.
 * L’historique est maintenu et transmis à la fonction `talkToAgent`.
 */
export function AgentChat({ agentKey, context, className }) {
  const agent = getAgent(agentKey);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [history, loading]);

  async function send(event) {
    event?.preventDefault();
    const text = message.trim();
    if (!text || loading) return;

    const nextHistory = [...history, { role: 'user', content: text }];
    setHistory(nextHistory);
    setMessage('');
    setLoading(true);
    setError(null);

    try {
      const res = await base44.functions.invoke('talkToAgent', {
        agent: agent.key,
        message: text,
        history: nextHistory.slice(-10),
        context: context || null,
      });
      const reply = res?.data?.reply || res?.reply;
      setHistory([...nextHistory, { role: 'assistant', content: reply || 'Je n’ai pas réussi à répondre.' }]);
    } catch (err) {
      setError(err?.message || 'La réponse n’est pas arrivée. Réessaie.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={cn('rounded-[19px] border border-white/12 bg-white/[0.02] p-5', className)}
      aria-label={`Conversation avec ${agent.name}`}
    >
      <div className="flex items-center gap-3">
        <AgentAvatar agent={agent} size={40} />
        <div>
          <p className="text-sm font-semibold text-cream">Affiner avec {agent.name}</p>
          <p className="text-xs text-muted-foreground">
            {agent.role} · pose une question ou demande une autre version
          </p>
        </div>
      </div>

      {history.length ? (
        <div className="ecp-scroll mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
          {history.map((entry, index) => (
            <div
              key={index}
              className={cn(
                'max-w-[92%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                entry.role === 'user'
                  ? 'ml-auto bg-primary/14 text-cream'
                  : 'border border-white/10 bg-black/30 text-cream/90',
              )}
            >
              {entry.content}
            </div>
          ))}
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {agent.name} rédige sa réponse…
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      ) : null}

      {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}

      <form onSubmit={send} className="mt-4 flex items-end gap-2">
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) send(event);
          }}
          placeholder={agent.chatPlaceholder}
          rows={2}
          className="min-h-[52px] flex-1"
        />
        <Button type="submit" size="icon" disabled={loading || !message.trim()} aria-label="Envoyer">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </section>
  );
}

export default AgentChat;
