import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import userRoutes from './modules/user/user.routes';
import categoryRoutes from './modules/category/category.routes';
import productRoutes from './modules/product/product.routes';
import cartRoutes from './modules/cart/cart.routes';
import orderRoutes from './modules/order/order.routes';
import discountRoutes from './modules/discount/discount.routes';
import systemConfigRoutes from './modules/system-config/system-config.routes';
import { errorMiddleware } from './common/middleware/error.middleware';
import { standardRateLimiter } from './common/middleware/rate-limit.middleware';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './docs/swagger.json';

const app: Express = express();

// Security Middlewares
app.set('trust proxy', 1);
app.use(helmet());

// Strict CORS Policy
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = [
    ...(frontendUrl ? frontendUrl.split(',') : []), // Cho phép truyền nhiều URL cách nhau bằng dấu phẩy
    'http://localhost:3000',
    'http://localhost:3001'
];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

if (process.env.NODE_ENV !== 'test') {
    app.use(standardRateLimiter);
}
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/system-configs', systemConfigRoutes);

// Basic Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(errorMiddleware);

export default app;
