import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { AppError } from '../errors/app-error';
import { asyncHandler } from './async-handler';
import redis from '../../config/redis';

// Extend Express Request to include user info
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: string;
            };
        }
    }
}

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // 1. Get token from header
    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw new AppError('You are not logged in. Please log in to get access.', 401);
    }

    // 2. Verify token
    try {
        const decoded = JwtUtil.verifyAccessToken(token);

        // 3. Check if token is blacklisted in Redis (from Logout)
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            throw new AppError('This token has been revoked. Please log in again.', 401);
        }

        // 4. Grant access
        req.user = {
            id: decoded.userId,
            role: decoded.role
        };
        next();
    } catch (err) {
        throw new AppError('Invalid token or token expired.', 401);
    }
});

export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
