import 'dotenv/config';
console.log('[Main] dotenv/config loaded');
console.log('[Main] DATABASE_URL present:', !!process.env.DATABASE_URL);

import app from './app';
import pino from 'pino';

const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
        },
    },
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    logger.info(`[server]: Server is running at http://localhost:${port}`);
});
