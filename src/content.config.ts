import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    featured: z.boolean().default(false),
    featuredOrder: z.number().int().positive().optional(),
    externalLink: z.string().url().optional(),
    image: z.string().optional(),
    gradient: z.string().optional(),
    tags: z.array(z.string()).default([]),
    metric: z.string().optional(),
    label: z.string().optional(),
  }),
});

export const collections = { projects };
