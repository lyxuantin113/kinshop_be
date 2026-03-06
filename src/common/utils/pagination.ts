/**
 * Standard Pagination Metadata
 */
export interface PaginationMeta {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
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
    totalItems: number,
    page: number,
    limit: number
): PaginationMeta => {
    const totalPages = Math.ceil(totalItems / limit);
    return {
        totalItems,
        itemCount: limit, // In a real scenario, this could be data.length
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
    };
};
