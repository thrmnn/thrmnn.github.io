import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.coerce.date(),
    status: z.string().optional(),
    summary: z.string(),
    register: z.enum(['cartesian', 'tropical']).default('cartesian'),
    featured: z.boolean().default(false),
    featuredOrder: z.number().int().positive().optional(),
    heroImage: z.string().optional(),
    heroAlt: z.string().optional(),
    /**
     * Classifies the hero asset.
     *   "photo"     — photographic; receives the paper-grain overlay
     *   "technical" — diagrammatic / LiDAR / CFD / plot; rendered as-is
     * Default is "technical" because every current project entry is
     * scientific imagery rather than photography.
     */
    heroKind: z.enum(['photo', 'technical']).default('technical'),
    collaborators: z.array(z.string()).default([]),
    links: z
      .object({
        paper: z.string().url().optional(),
        preprint: z.string().url().optional(),
        repo: z.string().url().optional(),
        app: z.string().url().optional(),
        site: z.string().url().optional(),
      })
      .default({}),
    tags: z.array(z.string()).default([]),
    updated: z.coerce.date().optional(),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    register: z.enum(['cartesian', 'tropical']).default('tropical'),
    language: z.enum(['en', 'fr', 'pt']).default('en'),
    tags: z.array(z.string()).default([]),
    updated: z.coerce.date().optional(),
  }),
});

export const collections = { projects, writing };
