import { z } from 'zod';
import { DiscountType, DiscountScope } from '@prisma/client';

export const CreateDiscountSchema = z.object({
    code: z.string().min(3).max(20).transform(v => v.toUpperCase()),
    type: z.nativeEnum(DiscountType),
    value: z.number().positive(),
    scope: z.nativeEnum(DiscountScope),
    productId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    minOrderAmount: z.number().min(0).default(0),
    usageLimit: z.number().int().positive().optional(),
    startDate: z.string().transform(v => new Date(v)),
    endDate: z.string().transform(v => new Date(v)),
    isActive: z.boolean().default(true),
}).refine(data => {
    if (data.scope === DiscountScope.PRODUCT && !data.productId) return false;
    if (data.scope === DiscountScope.CATEGORY && !data.categoryId) return false;
    return true;
}, {
    message: "ProductId or CategoryId is required for specific scopes",
    path: ["productId"]
});

export type CreateDiscountDto = z.infer<typeof CreateDiscountSchema>;
