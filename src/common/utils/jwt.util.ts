import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret_123';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_123';

export const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
export const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 days
export const REFRESH_TOKEN_REDIS_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export interface TokenPayload {
    userId: string;
    role: string;
}

export class JwtUtil {
    static generateAccessToken(payload: TokenPayload): string {
        return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    }

    static generateRefreshToken(payload: TokenPayload): string {
        return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
    }

    // Nhớ gôm lại 1 verify 
    static verifyAccessToken(token: string): TokenPayload {
        return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    }

    static verifyRefreshToken(token: string): TokenPayload {
        return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
    }
}
