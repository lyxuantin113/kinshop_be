import { Request, Response } from 'express';
import { OrderService } from './order.service';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';
import { OrderStatus } from '@prisma/client';
import { CheckoutSchema, OrderQuerySchema, PreviewCheckoutSchema, UpdateOrderStatusSchema } from './order.dto';

export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    previewCheckout = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const { couponCode } = PreviewCheckoutSchema.parse(req.body);

        const summary = await this.orderService.previewCheckout(userId, couponCode);

        res.status(200).json({
            status: 'success',
            data: {
                subtotal: summary.subtotal,
                shippingFee: summary.shippingFee,
                discountAmount: summary.discountAmount,
                totalAmount: summary.totalAmount
            }
        });
    });

    checkout = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const { couponCode, address, phoneNumber } = CheckoutSchema.parse(req.body);

        const order = await this.orderService.checkout(userId, { address, phoneNumber }, couponCode);

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
        const { page, limit, status, userId } = OrderQuerySchema.parse(req.query);

        const result = await this.orderService.getAllOrders({ page, limit, status, userId });

        res.status(200).json({
            status: 'success',
            ...result
        });
    });

    updateStatus = asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.orderId as string;
        const { status } = UpdateOrderStatusSchema.parse(req.body);

        const order = await this.orderService.updateStatus(orderId, status);

        res.status(200).json({
            status: 'success',
            data: order
        });
    });

    getAdminOrder = asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.orderId as string;
        const order = await this.orderService.getAdminOrderDetails(orderId);

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
