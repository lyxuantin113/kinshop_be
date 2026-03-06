import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import pino from 'pino';

import userRoutes from './modules/user/user.routes';
import categoryRoutes from './modules/category/category.routes';
import productRoutes from './modules/product/product.routes';
import { errorMiddleware } from './common/middleware/error.middleware';

dotenv.config();

const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
        },
    },
});

const app: Express = express();
const port = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);

// Basic Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorMiddleware);

app.listen(port, () => {
    logger.info(`[server]: Server is running at http://localhost:${port}`);
});
