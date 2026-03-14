import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const PreviewCheckoutSchema = z.object({
    couponCode: z.string().optional(),
});

export const CheckoutSchema = z.object({
    couponCode: z.string().optional(),
    address: z.string().min(5, 'Address must be at least 5 characters long'),
    phoneNumber: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Invalid Vietnamese phone number'),
});

export const UpdateOrderStatusSchema = z.object({
    status: z.nativeEnum(OrderStatus),
});

export const OrderQuerySchema = z.object({
    page: z.preprocess((val) => val ? Number(val) : 1, z.number().min(1).default(1)),
    limit: z.preprocess((val) => val ? Number(val) : 10, z.number().min(1).max(100).default(10)),
    status: z.nativeEnum(OrderStatus).optional(),
    userId: z.string().uuid().optional(),
});

export type PreviewCheckoutInput = z.infer<typeof PreviewCheckoutSchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
