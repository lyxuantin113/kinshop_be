import { Response } from 'express';
import { PaginationMeta } from './pagination';

export class ApiResponse {
    /**
     * Standard success response
     */
    static success<T>(res: Response, data: T, statusCode: number = 200) {
        return res.status(statusCode).json({
            status: 'success',
            data,
        });
    }

    /**
     * Standard paginated response
     */
    static paginated<T>(res: Response, data: T[], meta: PaginationMeta, statusCode: number = 200) {
        return res.status(statusCode).json({
            status: 'success',
            data,
            meta,
        });
    }

    /**
     * Standard no-content response (204)
     */
    static noContent(res: Response) {
        return res.status(204).send();
    }
}
