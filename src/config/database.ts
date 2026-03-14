import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { configs } from './index';

// Log only the host and database part for security
const sanitizedUrl = configs.DATABASE_URL.includes('@')
    ? configs.DATABASE_URL.split('@')[1]
    : configs.DATABASE_URL;
console.log('[DatabaseConfig] Initializing database pool with URL part:', sanitizedUrl);

export const pool = new Pool({
    connectionString: configs.DATABASE_URL,
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
    log: configs.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export default prisma;
