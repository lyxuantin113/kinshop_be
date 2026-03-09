import { OrderRepository } from './order.repository';
import { CartRepository } from '../cart/cart.repository';
import { ProductRepository } from '../product/product.repository';
import { ShippingService } from './shipping.service';
import { DiscountService } from '../discount/discount.service';
import prisma from '../../config/database';
import { AppError } from '../../common/errors/app-error';
import { Order, OrderStatus } from '@prisma/client';

export class OrderService {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly cartRepository: CartRepository,
        private readonly productRepository: ProductRepository,
        private readonly shippingService: ShippingService,
        private readonly discountService: DiscountService
    ) { }

    /**
     * Critical Checkout Logic with Shipping & Concurrency
     */
    async checkout(userId: string, couponCode?: string): Promise<Order> {
        const cart = await this.cartRepository.getByUserId(userId);
        if (!cart || cart.items.length === 0) {
            throw new AppError('Cart is empty', 400);
        }

        let subtotal = 0;
        const orderItemsData: any[] = [];

        for (const item of cart.items) {
            const price = Number(item.product.price);
            subtotal += price * item.quantity;

            orderItemsData.push({
                productId: item.productId,
                quantity: item.quantity,
                price: price
            });
        }

        // 1. Calculate Shipping
        const shippingFee = this.shippingService.calculateShippingFee(subtotal);

        // 2. Handle Discount if coupon provided
        let discountAmount = 0;
        let discountId: string | undefined;
        let discountToUpdate: any;

        if (couponCode) {
            const discount = await this.discountService.validateDiscount(couponCode, subtotal, cart.items);
            discountAmount = this.discountService.calculateDiscountAmount(discount, subtotal, cart.items);
            discountId = discount.id;
            discountToUpdate = discount;
        }

        const totalAmount = subtotal + shippingFee - discountAmount;

        return await prisma.$transaction(async (tx) => {
            // 3. Create Order
            const order = await tx.order.create({
                data: {
                    userId,
                    subtotal,
                    shippingFee,
                    discountAmount,
                    discountId,
                    totalAmount,
                    status: OrderStatus.PENDING,
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    items: true
                }
            });

            // 4. Update Discount usage (Optimistic Locking)
            if (discountToUpdate) {
                const discountUpdateResult = await tx.discount.updateMany({
                    where: {
                        id: discountToUpdate.id,
                        version: discountToUpdate.version,
                        // Safety check against race conditions even with validation before transaction
                        OR: [
                            { usageLimit: null },
                            { usedCount: { lt: discountToUpdate.usageLimit } }
                        ]
                    },
                    data: {
                        usedCount: { increment: 1 },
                        version: { increment: 1 }
                    }
                });

                if (discountUpdateResult.count === 0) {
                    throw new AppError('Coupon is no longer available or was concurrently updated.', 409);
                }
            }

            for (const item of cart.items) {
                const updateResult = await tx.product.updateMany({
                    where: {
                        id: item.productId,
                        stock: { gte: item.quantity }
                    },
                    data: {
                        stock: { decrement: item.quantity },
                        version: { increment: 1 }
                    }
                });

                if (updateResult.count === 0) {
                    throw new AppError(
                        `Crucial error: Product ${item.product.name} is no longer available. Please refresh cart.`,
                        409
                    );
                }
            }

            // 6. Clear cart
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id }
            });

            return order;
        });
    }

    async getMyOrders(userId: string): Promise<Order[]> {
        return this.orderRepository.findByUserId(userId);
    }

    async getOrderDetails(orderId: string, userId: string): Promise<Order> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) throw new AppError('Order not found', 404);

        if (order.userId !== userId) {
            throw new AppError('You do not have permission to view this order', 403);
        }

        return order;
    }
}
