import { z } from 'zod';
import { DietaryTag, ProductCategory } from './product.entity.js';

export const MAX_LEAD_TIME_DAYS = 60;

// Fields without defaults, shared by create and update.
const productFields = {
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000),
    category: z.enum(ProductCategory),
    priceCents: z.number().int().positive(),
    imageUrl: z.url({ protocol: /^https$/ }).nullable(),
    dietaryTags: z.array(z.enum(DietaryTag)).transform((tags) => [...new Set(tags)]),
    servings: z.number().int().positive().max(500).nullable(),
    weightGrams: z.number().int().positive().max(50_000).nullable(),
    leadTimeDays: z.number().int().min(1).max(MAX_LEAD_TIME_DAYS),
    available: z.boolean(),
    featured: z.boolean(),
    sortOrder: z.number().int().min(0).max(10_000),
};

export const createProductSchema = z.object({
    ...productFields,
    description: productFields.description.default(''),
    category: productFields.category.default(ProductCategory.CAKE),
    imageUrl: productFields.imageUrl.default(null),
    dietaryTags: productFields.dietaryTags.default([]),
    servings: productFields.servings.default(null),
    weightGrams: productFields.weightGrams.default(null),
    leadTimeDays: productFields.leadTimeDays.default(1),
    available: productFields.available.default(true),
    featured: productFields.featured.default(false),
    sortOrder: productFields.sortOrder.default(0),
});

// Only the fields sent are changed; an empty body is a mistake.
export const updateProductSchema = z
    .object(productFields)
    .partial()
    .refine((data) => Object.keys(data).length > 0, { message: 'Send at least one field to update' });

export const listProductsQuerySchema = z.object({
    available: z.stringbool().optional(),
    featured: z.stringbool().optional(),
    category: z.enum(ProductCategory).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
