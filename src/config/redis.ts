import Redis from 'ioredis';
import { configs } from './index';

const redisContext = {
    host: configs.REDIS_HOST,
    port: configs.REDIS_PORT,
    // Prevent hanging in tests if Redis is down
    maxRetriesPerRequest: configs.NODE_ENV === 'test' ? 1 : 20,
    retryStrategy: (times: number) => {
        if (configs.NODE_ENV === 'test') return null; // stop retrying
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
