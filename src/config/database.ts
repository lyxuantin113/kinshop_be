import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
    console.warn('[DatabaseConfig] DATABASE_URL is not defined in environment variables!');
} else {
    // Log only the host and database part for security
    const sanitizedUrl = process.env.DATABASE_URL.includes('@')
        ? process.env.DATABASE_URL.split('@')[1]
        : process.env.DATABASE_URL;
    console.log('[DatabaseConfig] Initializing database pool with URL part:', sanitizedUrl);
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Giới hạn số lượng connection
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Tăng timeout chờ kết nối
});

pool.on('error', (err) => {
    console.error('[DatabaseConfig] Unexpected error on idle client', err);
});

pool.on('connect', () => {
    console.log('[DatabaseConfig] New client connected to database');
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export default prisma;
