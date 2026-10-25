import { z } from 'zod';

export const createProductSchema = z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000).default(''),
    priceCents: z.number().int().positive(),
    available: z.boolean().default(true),
});

export const listProductsQuerySchema = z.object({
    available: z.stringbool().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
