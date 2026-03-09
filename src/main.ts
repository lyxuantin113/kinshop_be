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
