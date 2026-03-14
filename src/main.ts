import { configs } from './config/index';
import app from './app';
import logger from './common/utils/logger';
import { setupOrderListeners } from './modules/order/order.listener';

// Initialize Event Listeners
setupOrderListeners();

const port = configs.PORT;

const server = app.listen(port, () => {
    logger.info(`[server]: Server is running at http://localhost:${port}`);
});

// --- GRACEFUL SHUTDOWN ---
import prisma from './config/database';
import redis from './config/redis';

const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);

    server.close(() => {
        logger.info('HTTP server closed.');
    });

    try {
        await prisma.$disconnect();
        logger.info('Prisma disconnected.');

        await redis.quit();
        logger.info('Redis disconnected.');

        process.exit(0);
    } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
