import { Order, OrderItem, Prisma, OrderStatus } from '@prisma/client';
import prisma from '../../config/database';

export class OrderRepository {
    async createOrder(data: Prisma.OrderCreateInput): Promise<Order> {
        return prisma.order.create({
            data,
            include: {
                items: true
            }
        });
    }

    async findByUserId(userId: string): Promise<Order[]> {
        return prisma.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findById(id: string): Promise<Order | null> {
        return prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
    }

    async findAll(params: {
        page: number;
        limit: number;
        status?: OrderStatus;
        userId?: string;
    }) {
        const { page, limit, status, userId } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.OrderWhereInput = {};
        if (status) where.status = status;
        if (userId) where.userId = userId;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: { id: true, email: true, name: true }
                    },
                    items: {
                        include: { product: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.order.count({ where })
        ]);

        return { orders, total };
    }

    async updateStatus(id: string, status: OrderStatus): Promise<Order> {
        return prisma.order.update({
            where: { id },
            data: { status }
        });
    }

    async getStats() {
        const [totalRevenue, totalOrders] = await Promise.all([
            prisma.order.aggregate({
                where: { status: { not: OrderStatus.CANCELLED } },
                _sum: { totalAmount: true }
            }),
            prisma.order.count()
        ]);

        return {
            revenue: totalRevenue._sum.totalAmount || 0,
            orders: totalOrders
        };
    }
}
