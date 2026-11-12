import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44';
import { useAuth } from '@/components/AuthProvider';
import { JOURNEY, findTool, nextStepPath } from '@/lib/navigation';

/**
 * Parcours guidé : lit les ToolResult de l’utilisateur pour savoir
 * quels outils ont déjà servi, et déduit la prochaine étape.
 */
export function useJourney() {
  const { isAuthenticated } = useAuth();
  const [donePaths, setDonePaths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isAuthenticated) {
        if (!cancelled) {
          setDonePaths([]);
          setLoading(false);
        }
        return;
      }
      try {
        const records = await base44.entities.ToolResult.list('-savedAt', 200);
        if (cancelled) return;
        setDonePaths((records || []).map((record) => record.tool_key).filter(Boolean));
      } catch {
        if (!cancelled) setDonePaths([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const explored = donePaths.filter((path) => JOURNEY.includes(path));
  const nextPath = nextStepPath(explored);

  return {
    loading,
    donePaths: explored,
    nextPath,
    nextTool: nextPath ? findTool(nextPath) : null,
    progress: { done: explored.length, total: JOURNEY.length },
  };
}

export default useJourney;
