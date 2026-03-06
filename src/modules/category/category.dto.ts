import { z } from 'zod';

export const CategorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z.string().min(2, 'Slug must be at least 2 characters'),
    description: z.string().optional(),
});

export type CategoryInput = z.infer<typeof CategorySchema>;
