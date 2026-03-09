import { Discount } from '@prisma/client';
import prisma from '../../config/database';
import { CreateDiscountDto } from './discount.dto';

export class DiscountRepository {
    async create(data: CreateDiscountDto): Promise<Discount> {
        return await prisma.discount.create({
            data: {
                ...data,
                value: data.value,
                minOrderAmount: data.minOrderAmount,
            }
        });
    }

    async findByCode(code: string): Promise<Discount | null> {
        return await prisma.discount.findUnique({
            where: { code: code.toUpperCase() }
        });
    }

    async findById(id: string): Promise<Discount | null> {
        return await prisma.discount.findUnique({
            where: { id }
        });
    }

    async getAll(): Promise<Discount[]> {
        return await prisma.discount.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
}
