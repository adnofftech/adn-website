import { useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44';
import { useAuth } from '@/components/AuthProvider';

/** Niche utilisée en mode démo (invité). Identique à celle du backend. */
export const DEMO_NICHE = 'produits et accessoires pour animaux de compagnie (chiens, chats, NAC)';

export const MILESTONE_KEYS = [
  'first_visit',
  'first_100_visits',
  'first_add_to_cart',
  'first_sale',
  'first_10_sales',
  'first_1000_revenue',
  'first_profitable_day',
  'first_10000_revenue',
];

export const MILESTONES = [
  { key: 'first_visit', label: 'Ma première visite', hint: 'Quelqu’un est arrivé sur ta boutique.' },
  { key: 'first_100_visits', label: 'Mes 100 premières visites', hint: 'Assez de monde pour commencer à lire les chiffres.' },
  { key: 'first_add_to_cart', label: 'Mon premier ajout au panier', hint: 'Ton produit intéresse : le prix et la fiche fonctionnent.' },
  { key: 'first_sale', label: 'Ma première vente', hint: 'La preuve que tout le tunnel marche.' },
  { key: 'first_10_sales', label: 'Mes 10 premières ventes', hint: 'Ce n’est plus un coup de chance.' },
  { key: 'first_1000_revenue', label: 'Mes premiers 1 000 € de chiffre d’affaires', hint: 'Le palier de la roadmap.' },
  { key: 'first_profitable_day', label: 'Ma première journée rentable', hint: 'Plus d’argent gagné que dépensé en publicité.' },
  { key: 'first_10000_revenue', label: 'Mes premiers 10 000 €', hint: 'Le moment de penser à passer à l’échelle.' },
];

/**
 * Profil e-commerce de l’utilisateur.
 * Invité (démo) : niche partagée, aucune persistance.
 * Connecté : niche, photo produit, mode débutant et étapes lus sur le User.
 */
export function useEcomProfile() {
  const { user, isAuthenticated, loading, checkUserAuth } = useAuth();
  const isGuest = !isAuthenticated || !user;

  const profile = useMemo(() => {
    if (isGuest) {
      return {
        niche: DEMO_NICHE,
        productPhoto: null,
        beginnerMode: true,
        milestones: {},
      };
    }
    return {
      niche: user.niche || '',
      productPhoto: user.productPhoto || null,
      beginnerMode: user.beginnerMode !== false,
      milestones: user.milestones || {},
    };
  }, [isGuest, user]);

  const updateProfile = useCallback(
    async (patch) => {
      if (isGuest) return null; // mode démo : rien n’est enregistré
      const updated = await base44.auth.updateMe(patch);
      await checkUserAuth();
      return updated;
    },
    [isGuest, checkUserAuth],
  );

  const toggleMilestone = useCallback(
    async (key) => {
      if (isGuest) return null;
      const milestones = { ...(user.milestones || {}) };
      milestones[key] = !milestones[key];
      return updateProfile({ milestones });
    },
    [isGuest, user, updateProfile],
  );

  return {
    ...profile,
    user,
    isGuest,
    loading,
    isOnboarded: Boolean(profile.niche?.trim()),
    updateProfile,
    toggleMilestone,
  };
}

export default useEcomProfile;
