import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';

/**
 * Senior Level Global Error Handler
 */
export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // 1. Handle Zod Validation Errors
    if (err instanceof ZodError) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation Error',
            errors: err.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message
            }))
        });
    }

    // 2. Handle Prisma Specific Errors (e.g., Unique constraint)
    if (err.code === 'P2002') {
        statusCode = 409;
        message = 'Duplicate field value entered';
    }

    // 3. Operational Errors (AppError) vs Unexpected Errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        });
    }

    // Log unexpected errors for developers
    console.error('ERROR 💥:', err);

    res.status(statusCode).json({
        status: 'error',
        message: process.env.NODE_ENV === 'development' ? err.stack : message
    });
};
