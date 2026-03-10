import { User, Prisma } from '@prisma/client';
import prisma from '../../config/database';

export class UserRepository {
    async findByEmail(email: string): Promise<User | null> {
        return prisma.user.findFirst({
            where: { email, deletedAt: null },
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return prisma.user.create({
            data,
        });
    }

    async findById(id: string): Promise<User | null> {
        return prisma.user.findFirst({
            where: { id, deletedAt: null },
        });
    }

    async findAll(params: { skip: number; take: number }): Promise<{ data: User[]; total: number }> {
        const where: Prisma.UserWhereInput = { deletedAt: null };

        const [data, total] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: params.skip,
                take: params.take,
            }),
            prisma.user.count({ where })
        ]);

        return { data, total };
    }

    async softDelete(id: string): Promise<User> {
        return prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
