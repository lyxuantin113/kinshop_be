import { OrderRepository } from './order.repository';
import { CartRepository } from '../cart/cart.repository';
import { ProductRepository } from '../product/product.repository';
import prisma from '../../config/database';
import { AppError } from '../../common/errors/app-error';
import { Order, OrderStatus } from '@prisma/client';

export class OrderService {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly cartRepository: CartRepository,
        private readonly productRepository: ProductRepository
    ) { }

    /**
     * Critical Checkout Logic with Concurrency Control
     * 1. Pre-fetch full cart with product data (Avoid N+1)
     * 2. Transaction with Optimistic Locking & Atomic Conditionals
     */
    async checkout(userId: string): Promise<Order> {
        // 1. Pre-fetch full cart in one query (Prisma handles joins efficiently)
        const cart = await this.cartRepository.getByUserId(userId);
        if (!cart || cart.items.length === 0) {
            throw new AppError('Cart is empty', 400);
        }

        let totalAmount = 0;
        const orderItemsData: any[] = [];

        // Calculate totals and prepare data
        for (const item of cart.items) {
            const price = Number(item.product.price);
            totalAmount += price * item.quantity;

            orderItemsData.push({
                productId: item.productId,
                quantity: item.quantity,
                price: price
            });
        }

        // 2. Atomic Transaction
        return await prisma.$transaction(async (tx) => {
            // Create Order
            const order = await tx.order.create({
                data: {
                    userId,
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

            /**
             * Optimistic Locking & Atomic Conditional Update
             * For each product:
             * - We check version AND stock in the WHERE clause
             * - We increment version AND decrement stock in the UPDATE
             */
            for (const item of cart.items) {
                const updateResult = await tx.product.updateMany({
                    where: {
                        id: item.productId,
                        version: item.product.version, // Optimistic Lock
                        stock: { gte: item.quantity } // Condition to ensure enough stock
                    },
                    data: {
                        stock: { decrement: item.quantity },
                        version: { increment: 1 }
                    }
                });

                // If no rows affected, it means version changed or stock became insufficient
                if (updateResult.count === 0) {
                    throw new AppError(
                        `Crucial error: Product ${item.product.name} is no longer available or price/version changed. Please refresh cart.`,
                        409 // Conflict
                    );
                }
            }

            // Clear cart
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
