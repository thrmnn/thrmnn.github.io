import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    featured: z.boolean().default(false),
    externalLink: z.string().url().optional(),
    image: z.string().optional(),
    gradient: z.string().optional(),
    tags: z.array(z.string()).default([]),
    metric: z.string().optional(),
    label: z.string().optional(),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    date: z.coerce.date(),
    publicationType: z.string(),
    publication: z.string(),
    publicationShort: z.string(),
    abstract: z.string(),
    summary: z.string().optional(),
    doi: z.string().optional(),
    links: z.object({
      pdf: z.string().url().optional(),
      code: z.string().url().optional(),
    }).default({}),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { projects, publications, posts };
