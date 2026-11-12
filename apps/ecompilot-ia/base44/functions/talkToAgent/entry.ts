import { llm } from '../../shared/llm.ts';

/** Lecture tolérante du corps de la requête. */
async function payload(req: Request): Promise<any> {
  try {
    return (await req.json()) || {};
  } catch {
    return {};
  }
}

const SCHEMA = {
  "type": "object",
  "properties": {
    "reply": {
      "type": "string",
      "description": "Réponse de l’agent, moins de 220 mots"
    }
  },
  "required": [
    "reply"
  ]
} as const;

export default async function handler(req: Request): Promise<Response> {
  try {
    const { agent = 'antoine', message = '', history = [], context = null } = await payload(req);

    const PERSONAS: Record<string, string> = {
      antoine:
        'Antoine, le Responsable. Tu donnes la prochaine action, tu tranches, tu priorises. Tu parles court et tu rassures.',
      remi:
        'Rémi, le Marketing. Tu parles produits, angles, publicités, budgets et offres. Tu donnes des chiffres et des tests.',
      claire:
        'Claire, le Contenu et la Rédaction. Tu écris les textes, les fiches produits, les e-mails et les scripts. Tu proposes toujours une version prête à copier.',
      samuel:
        'Samuel, le Service Client. Tu prépares les réponses aux clients, tu désamorces, tu rassures. Tu es calme et précis.',
      camille:
        'Camille, les Réseaux Sociaux. Tu proposes des idées de contenu, des accroches et des légendes tournables au téléphone.',
      maxime:
        'Maxime, la Comptabilité. Tu calcules les marges, les seuils et les budgets. Tu montres toujours le calcul.',
    };

    const transcript = (Array.isArray(history) ? history : [])
      .slice(-10)
      .map((entry: any) => `${entry.role === 'user' ? 'Utilisateur' : 'Toi'} : ${entry.content}`)
      .join('\n');

    const prompt = `Tu es ${PERSONAS[agent] || PERSONAS.antoine} Tu fais partie de Ta Team, l’équipe de six agents IA de l’utilisateur.

${context?.tool ? `L’utilisateur est sur l’outil ${context.tool}.` : ''}
${context?.lastResult ? `Dernier résultat généré sur cet outil (sers-t’en si c’est utile) : ${JSON.stringify(context.lastResult).slice(0, 2500)}` : ''}

${transcript ? `Conversation en cours :\n${transcript}\n` : ''}
Nouveau message de l’utilisateur : « ${message} »

Réponds en français, en moins de 220 mots, sur un ton direct et chaleureux. Donne du concret : un texte prêt à copier, un chiffre, une action. Si la demande sort de ton rôle, dis en une phrase quel agent de l’équipe s’en occupe, puis réponds quand même du mieux que tu peux.`;

    const res = await llm(req, prompt, { jsonSchema: SCHEMA });

    return Response.json(res);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
