import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const portfolio = defineCollection({
  loader: glob({ pattern: ['**/*.{md,mdx}', '!**/_*.{md,mdx}'], base: './src/content/portfolio' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    heroImage: image(),
    alt: z.string(),
    year: z.number().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().optional(),
    medium: z.string().optional(),
    dimensions: z.string().optional(),
    objectPosition: z.string().optional(),
  }),
});

const books = defineCollection({
  loader: glob({ pattern: ['**/*.{md,mdx}', '!**/_*.{md,mdx}'], base: './src/content/books' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    cover: image(),
    alt: z.string(),
    year: z.number().optional(),
    numPages: z.number().optional(),
    order: z.number().optional(),
  }),
});

export const collections = { portfolio, books };
