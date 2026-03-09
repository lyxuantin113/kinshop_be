import { Order, OrderItem, Prisma } from '@prisma/client';
import prisma from '../../config/database';

export class OrderRepository {
    /**
     * Senior Level: Complex Transactional Order Creation
     * This is wrapped in a transaction along with stock updates in the Service layer
     */
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

    async updateStatus(id: string, status: any): Promise<Order> {
        return prisma.order.update({
            where: { id },
            data: { status }
        });
    }
}
