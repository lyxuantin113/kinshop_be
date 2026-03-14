import pino from 'pino';
import { configs } from '../../config/index';

const logger = pino({
    level: configs.NODE_ENV === 'development' ? 'debug' : 'info',
    transport: configs.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
        },
    } : undefined,
});

export default logger;
