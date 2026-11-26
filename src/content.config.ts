import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { seriesIds } from './data/series';

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
    cardImage: z.string().optional(),
    cardAnim: z.string().optional(),
    imagePhone: z.string().optional(),
    imageAlt: z.string().optional(),
    imageWidth: z.number().optional(),
    imageHeight: z.number().optional(),
    railImage: z.string().optional(),
    railImageSize: z.number().optional(),
    gradient: z.string().optional(),
    plateName: z.string().optional(),
    tags: z.array(z.string()).default([]),
    metric: z.string().optional(),
    label: z.string().optional(),
    figure: z.enum(['tracks']).optional(),
    facts: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    series: z.enum(seriesIds),
    draft: z.boolean().default(false),
    fixture: z.boolean().default(false),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageCaption: z.string().optional(),
    talk: z.string().optional(),
  }),
});

export const collections = { projects, writing };
