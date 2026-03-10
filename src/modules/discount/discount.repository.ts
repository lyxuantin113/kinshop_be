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
        return await prisma.discount.findFirst({
            where: { code: code.toUpperCase(), deletedAt: null }
        });
    }

    async findById(id: string): Promise<Discount | null> {
        return await prisma.discount.findFirst({
            where: { id, deletedAt: null }
        });
    }

    async getAll(): Promise<Discount[]> {
        return await prisma.discount.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' }
        });
    }

    async update(id: string, data: Partial<CreateDiscountDto>): Promise<Discount> {
        return await prisma.discount.update({
            where: { id },
            data: {
                ...data,
                code: data.code ? data.code.toUpperCase() : undefined
            }
        });
    }

    async softDelete(id: string): Promise<void> {
        await prisma.discount.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
