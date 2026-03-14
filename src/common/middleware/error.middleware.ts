import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';
import logger from '../utils/logger';

/**
 * Global Error Handler
 */
export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { method, url, user } = req;
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

    // 2. Handle Prisma Specific Errors
    if (err.code === 'P2002') {
        statusCode = 409;
        message = `Unique constraint failed on field(s): ${(err.meta?.target as string[])?.join(', ') || 'unknown'}`;
    } else if (err.code === 'P2025') {
        statusCode = 404;
        message = 'Record not found';
    } else if (err.code === 'P2003') {
        statusCode = 409;
        message = 'Foreign key constraint failed. This record is referenced by other data.';
    }

    // 3. Operational Errors (AppError)
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    // Global Log Structure
    const logData = {
        err,
        request: {
            method,
            url,
            userId: user?.id,
            body: method !== 'GET' ? req.body : undefined
        }
    };

    if (statusCode >= 500) {
        logger.error(logData, `[SERVER_ERROR] ${message}`);
    } else {
        logger.warn(logData, `[REQUEST_ERROR] ${message}`);
    }

    res.status(statusCode).json({
        status: 'error',
        message: process.env.NODE_ENV === 'development' ? err.message : message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
