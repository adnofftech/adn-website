import { createClientFromRequest } from '@base44/sdk';

/** Niche utilisée en mode démo (invité non authentifié). */
export const DEMO_NICHE = 'produits et accessoires pour animaux de compagnie (chiens, chats, NAC)';

export type LlmOptions = {
  /** Schéma JSON attendu en sortie. Si fourni, la réponse est un objet JSON strict. */
  jsonSchema?: Record<string, unknown>;
  /** Active la recherche web temps réel. */
  web?: boolean;
  /** Joint la photo produit de l’utilisateur au contexte. */
  useProductPhoto?: boolean;
  /** Fichiers supplémentaires à joindre (URLs). */
  file_urls?: string[];
  /** Modèle à forcer. Par défaut gemini_3_flash. */
  model?: string;
};

const MAX_ATTEMPTS = 3;

/**
 * Appel LLM partagé par toutes les fonctions de génération.
 * Construit le system prompt français (mode débutant, niche de l’utilisateur),
 * force le format JSON quand un schéma est fourni, et réessaie 3 fois.
 */
export async function llm(req: Request, prompt: string, options: LlmOptions = {}) {
  const base44 = createClientFromRequest(req);

  let user: any = null;
  try {
    user = await base44.auth.me();
  } catch {
    user = null; // invité : mode démo
  }

  const niche = (user?.niche || '').trim() || DEMO_NICHE;
  const beginnerMode = user?.beginnerMode !== false;
  const productPhoto = user?.productPhoto || null;

  const system = [
    'Tu es EcomPilot IA, un coach e-commerce expert qui accompagne des débutants francophones',
    'en dropshipping sur Shopify. Réponds TOUJOURS en français.',
    `Niche de l’utilisateur : "${niche}".`,
    beginnerMode
      ? 'MODE DÉBUTANT activé : français simple, aucun jargon non expliqué, ton encourageant et rassurant.'
      : 'Mode avancé : tu peux employer le vocabulaire technique du métier.',
    productPhoto && options.useProductPhoto
      ? 'Une photo du produit principal est fournie : sers-t’en comme contexte et décris ce que tu vois.'
      : '',
    'Sois concret, spécifique à la niche et orienté action. Jamais de réponse générique.',
    'Donne des chiffres réalistes et des exemples utilisables tels quels.',
  ]
    .filter(Boolean)
    .join(' ');

  const jsonInstruction = options.jsonSchema
    ? ' Réponds UNIQUEMENT par un objet JSON valide conforme au schéma. Pas de texte autour, pas de backticks.'
    : '';

  const file_urls =
    options.file_urls || (options.useProductPhoto && productPhoto ? [productPhoto] : undefined);

  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${system}\n\n${prompt}${jsonInstruction}`,
        response_json_schema: options.jsonSchema,
        add_context_from_internet: options.web || false,
        file_urls,
        model: options.model || 'gemini_3_flash',
      });
      return res;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

export default llm;
