/**
 * Standard Pagination Metadata
 */
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Standard Paginated Response Wrapper
 */
export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

/**
 * Pagination Utility: Calculates metadata based on total count and current page/limit
 */
export const getPaginationMeta = (
    total: number,
    page: number,
    limit: number
): PaginationMeta => {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
    };
};
