import { z } from 'zod';

export const ProductImageSchema = z.object({
    url: z.string().url('Invalid image URL'),
    publicId: z.string().optional(),
    isPrimary: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
    altText: z.string().optional(),
});

export const CreateProductSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z.string().min(2, 'Slug must be at least 2 characters'),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    stock: z.number().int().nonnegative('Stock cannot be negative').default(0),
    categoryId: z.string().uuid('Invalid category ID'),
    images: z.array(ProductImageSchema).optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

/**
 * Advanced Product Query Schema
 */
export const ProductQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    categoryId: z.string().uuid().optional(),
    search: z.string().optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    sortBy: z.enum(['price', 'createdAt', 'name']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ProductQuery = z.infer<typeof ProductQuerySchema>;
