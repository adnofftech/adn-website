import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44';
import { useAuth } from '@/components/AuthProvider';

/**
 * Hook d’appel IA partagé par tous les outils.
 * `toolKey` (le chemin de la route) active la mémoire : le dernier résultat
 * est enregistré dans l’entité ToolResult et restauré au retour sur l’outil.
 */
export function useAi(toolKey) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [restoring, setRestoring] = useState(Boolean(toolKey));
  const recordId = useRef(null);

  // Restauration du dernier résultat enregistré.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!toolKey || !isAuthenticated) {
        setRestoring(false);
        return;
      }
      try {
        const [record] = await base44.entities.ToolResult.filter({ tool_key: toolKey }, '-savedAt', 1);
        if (cancelled || !record) return;
        recordId.current = record.id;
        if (record.data) {
          setData(record.data);
          setSavedAt(record.savedAt || record.updated_date || null);
        }
      } catch {
        /* la mémoire n’est pas critique : on continue sans */
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }

    setRestoring(Boolean(toolKey));
    restore();
    return () => {
      cancelled = true;
    };
  }, [toolKey, isAuthenticated]);

  const persist = useCallback(
    async (result) => {
      if (!toolKey || !isAuthenticated) return;
      const savedAtIso = new Date().toISOString();
      try {
        if (recordId.current) {
          await base44.entities.ToolResult.update(recordId.current, { data: result, savedAt: savedAtIso });
        } else {
          const [existing] = await base44.entities.ToolResult.filter({ tool_key: toolKey }, '-savedAt', 1);
          if (existing) {
            recordId.current = existing.id;
            await base44.entities.ToolResult.update(existing.id, { data: result, savedAt: savedAtIso });
          } else {
            const created = await base44.entities.ToolResult.create({
              tool_key: toolKey,
              data: result,
              savedAt: savedAtIso,
            });
            recordId.current = created.id;
          }
        }
        setSavedAt(savedAtIso);
      } catch {
        /* on garde le résultat à l’écran même si l’enregistrement échoue */
      }
    },
    [toolKey, isAuthenticated],
  );

  const call = useCallback(
    async (name, payload = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await base44.functions.invoke(name, payload);
        const result = res?.data ?? res;
        setData(result);
        await persist(result);
        return result;
      } catch (err) {
        setError(err?.message || 'La génération a échoué. Réessaie dans un instant.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [persist],
  );

  return { data, loading, error, call, setData, savedAt, hasSaved: Boolean(savedAt), restoring };
}

export default useAi;
