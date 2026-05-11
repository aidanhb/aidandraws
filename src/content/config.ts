import { defineCollection, z } from 'astro:content';

const portfolio = defineCollection({
  type: 'content',
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
    flipbook: z.string().optional(),
    objectPosition: z.string().optional(),
  }),
});

export const collections = { portfolio };
