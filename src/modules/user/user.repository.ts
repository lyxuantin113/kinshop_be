import { User, Prisma } from '@prisma/client';
import prisma from '../../config/database';

export class UserRepository {
    async findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return prisma.user.create({
            data,
        });
    }

    async findById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id },
        });
    }

    /**
     * Senior Level: Parallel Count & Find
     */
    async findAll(params: { skip: number; take: number }): Promise<{ data: User[]; total: number }> {
        const [data, total] = await prisma.$transaction([
            prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                skip: params.skip,
                take: params.take,
            }),
            prisma.user.count()
        ]);

        return { data, total };
    }
}
