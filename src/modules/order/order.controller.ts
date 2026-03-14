import { Request, Response } from 'express';
import { OrderService } from './order.service';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';
import { OrderStatus } from '@prisma/client';
import { ApiResponse } from '../../common/utils/api-response';
import { CheckoutSchema, OrderQuerySchema, PreviewCheckoutSchema, UpdateOrderStatusSchema } from './order.dto';

export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    previewCheckout = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const { couponCode } = PreviewCheckoutSchema.parse(req.body);

        const summary = await this.orderService.previewCheckout(userId, couponCode);

        return ApiResponse.success(res, {
            subtotal: summary.subtotal,
            shippingFee: summary.shippingFee,
            discountAmount: summary.discountAmount,
            totalAmount: summary.totalAmount
        });
    });

    checkout = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const { couponCode, address, phoneNumber } = CheckoutSchema.parse(req.body);

        const order = await this.orderService.checkout(userId, { address, phoneNumber }, couponCode);

        return ApiResponse.success(res, order, 201);
    });

    getMyOrders = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const orders = await this.orderService.getMyOrders(userId);

        return ApiResponse.success(res, orders);
    });

    getOrder = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const orderId = req.params.orderId as string;
        const order = await this.orderService.getOrderDetails(orderId, userId);

        return ApiResponse.success(res, order);
    });

    // Admin Endpoints
    getAllOrders = asyncHandler(async (req: Request, res: Response) => {
        const { page, limit, status, userId } = OrderQuerySchema.parse(req.query);

        const result = await this.orderService.getAllOrders({ page, limit, status, userId });

        return ApiResponse.paginated(res, result.data, result.meta);
    });

    updateStatus = asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.orderId as string;
        const { status } = UpdateOrderStatusSchema.parse(req.body);

        const order = await this.orderService.updateStatus(orderId, status);

        return ApiResponse.success(res, order);
    });

    getAdminOrder = asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.orderId as string;
        const order = await this.orderService.getAdminOrderDetails(orderId);

        return ApiResponse.success(res, order);
    });

    getStats = asyncHandler(async (req: Request, res: Response) => {
        const stats = await this.orderService.getDashboardStats();

        return ApiResponse.success(res, stats);
    });
}
