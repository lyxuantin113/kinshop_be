import { z } from 'zod';

export const AddToCartSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().positive('Quantity must be at least 1').default(1),
});

export const UpdateCartItemSchema = z.object({
    quantity: z.number().int().positive('Quantity must be at least 1'),
});

export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
