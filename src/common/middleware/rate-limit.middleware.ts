import rateLimit from 'express-rate-limit';
import { AppError } from '../errors/app-error';
import { Request, Response } from 'express';

/**
 * Standard Rate Limiter - 100 requests per 15 minutes
 */
export const standardRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 500,
    skip: (req: Request) => process.env.NODE_ENV === 'test' || req.user?.role === 'ADMIN',
    message: {
        status: 'fail',
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict Rate Limiter - 10 requests per 15 minutes
 * Best for Login, Register, Refresh Token
 */
export const authRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    skip: (req: Request) => process.env.NODE_ENV === 'test' || req.user?.role === 'ADMIN',
    handler: (req, res, next, options) => {
        throw new AppError(options.message.message, 429);
    },
    message: {
        status: 'fail',
        message: 'Too many authentication attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
