import { z } from 'zod';

/**
 * Standard Pagination Query Schema
 * Default: Page 1, Limit 10. Max Limit: 100 (Senior rule: Protect the DB)
 */
export const PaginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100, 'Limit too high').default(10),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
