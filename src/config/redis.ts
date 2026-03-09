import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisContext = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    // Prevent hanging in tests if Redis is down
    maxRetriesPerRequest: process.env.NODE_ENV === 'test' ? 1 : 20,
    retryStrategy: (times: number) => {
        if (process.env.NODE_ENV === 'test') return null; // stop retrying
        return Math.min(times * 50, 2000);
    },
    lazyConnect: true
};

const redis = new Redis(redisContext);

redis.on('connect', () => {
    console.log('✅ Connected to Redis (Memorystore)');
});

redis.on('error', (err) => {
    console.error('❌ Redis Error:', err);
});

export default redis;
