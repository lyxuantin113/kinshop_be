import { Category, Prisma } from '@prisma/client';
import prisma from '../../config/database';

export class CategoryRepository {
    async create(data: Prisma.CategoryCreateInput): Promise<Category> {
        return prisma.category.create({ data });
    }

    async findById(id: string): Promise<Category | null> {
        return prisma.category.findFirst({ where: { id, deletedAt: null } });
    }

    async findBySlug(slug: string): Promise<Category | null> {
        return prisma.category.findFirst({ where: { slug, deletedAt: null } });
    }

    async findAll(params: { skip: number; take: number }): Promise<{ data: Category[]; total: number }> {
        const where: Prisma.CategoryWhereInput = { deletedAt: null };

        const [data, total] = await prisma.$transaction([
            prisma.category.findMany({
                where,
                orderBy: { name: 'asc' },
                skip: params.skip,
                take: params.take,
            }),
            prisma.category.count({ where })
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
        return prisma.category.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
