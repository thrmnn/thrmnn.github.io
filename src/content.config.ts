import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    featuredOrder: z.number().int().positive().optional(),
    draft: z.boolean().default(false),
    externalLink: z.url().optional(),
    github: z.url().optional(),
    proprietary: z.boolean().default(false),
    image: z.string().optional(),
    gradient: z.string().optional(),
    tags: z.array(z.string()).default([]),
    metric: z.string().optional(),
    label: z.string().optional(),
  }),
});

export const collections = { projects };
