import { Request, Response } from 'express';
import { OrderService } from './order.service';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';

export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    checkout = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const { couponCode } = req.body;
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
}
