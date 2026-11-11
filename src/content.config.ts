import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

/**
 * Modèle de contenu d'une réalisation. Les champs facultatifs peuvent rester absents.
 * - image : chemin relatif à src/content (ex. "../assets/realisations/hibiscus.jpg")
 * - detail : gros plan facultatif ; sans lui, la visionneuse propose un recadrage de l'image principale
 * - cadrage : point d'intérêt en pourcentage (x, y) pour les recadrages (vignettes, vue détail)
 * - placeholder : true tant que l'image est une texture d'attente et non la photographie originale
 */
const realisations = defineCollection({
  loader: file('./src/content/realisations.json'),
  schema: ({ image }) =>
    z.object({
      titre: z.string(),
      categorie: z.enum(['floral', 'lettrage', 'detaille']).optional(),
      alt: z.string(),
      motif: z.string().optional(),
      zone: z.string().optional(),
      encres: z.array(z.enum(['noire', 'rouge'])).optional(),
      image: image(),
      detail: image().optional(),
      cadrage: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).default({ x: 50, y: 50 }),
      placeholder: z.boolean().default(false),
      publication: z.object({
        autorisee: z.boolean(),
        source: z.string(),
      }),
      accueil: z.boolean().default(false),
      ordre: z.number().int().default(0),
    }),
});

export const collections = { realisations };
