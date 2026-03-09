import { Request, Response } from 'express';
import { OrderService } from './order.service';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';
import { OrderStatus } from '@prisma/client';

export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    checkout = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const { couponCode } = req.body || {};
        const order = await this.orderService.checkout(userId, couponCode);

        res.status(201).json({
            status: 'success',
            data: order
        });
    });

    getMyOrders = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const orders = await this.orderService.getMyOrders(userId);

        res.status(200).json({
            status: 'success',
            data: orders
        });
    });

    getOrder = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const orderId = req.params.orderId as string;
        const order = await this.orderService.getOrderDetails(orderId, userId);

        res.status(200).json({
            status: 'success',
            data: order
        });
    });

    // Admin Endpoints
    getAllOrders = asyncHandler(async (req: Request, res: Response) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const status = req.query.status as OrderStatus | undefined;
        const userId = req.query.userId as string | undefined;

        const result = await this.orderService.getAllOrders({ page, limit, status, userId });

        res.status(200).json({
            status: 'success',
            ...result
        });
    });

    updateStatus = asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.orderId as string;
        const { status } = req.body;

        if (!status) throw new AppError('Status is required', 400);

        const order = await this.orderService.updateStatus(orderId, status as OrderStatus);

        res.status(200).json({
            status: 'success',
            data: order
        });
    });

    getStats = asyncHandler(async (req: Request, res: Response) => {
        const stats = await this.orderService.getDashboardStats();

        res.status(200).json({
            status: 'success',
            data: stats
        });
    });
}
