import { Category, Prisma } from '@prisma/client';
import prisma from '../../config/database';

export class CategoryRepository {
    async create(data: Prisma.CategoryCreateInput): Promise<Category> {
        return prisma.category.create({ data });
    }

    async findById(id: string): Promise<Category | null> {
        return prisma.category.findUnique({ where: { id } });
    }

    async findBySlug(slug: string): Promise<Category | null> {
        return prisma.category.findUnique({ where: { slug } });
    }

    /**
     * Senior Level: Parallel Count & Find
     */
    async findAll(params: { skip: number; take: number }): Promise<{ data: Category[]; total: number }> {
        const [data, total] = await prisma.$transaction([
            prisma.category.findMany({
                orderBy: { name: 'asc' },
                skip: params.skip,
                take: params.take,
            }),
            prisma.category.count()
        ]);

        return { data, total };
    }

    async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
        return prisma.category.update({
            where: { id },
            data,
        });
    }

    async delete(id: string): Promise<Category> {
        return prisma.category.delete({ where: { id } });
    }
}
