import { Product, ProductImage, Prisma } from '@prisma/client';
import prisma from '../../config/database';

export interface CreateProductInputWithImages extends Omit<Prisma.ProductUncheckedCreateInput, 'images'> {
    images?: Prisma.ProductImageCreateWithoutProductInput[];
}

export class ProductRepository {
    async create(data: CreateProductInputWithImages): Promise<Product & { images: ProductImage[] }> {
        const { images, ...productData } = data;

        return prisma.product.create({
            data: {
                ...productData,
                images: images ? {
                    create: images
                } : undefined
            },
            include: {
                images: true,
                category: true
            }
        }) as any;
    }

    /**
     * Senior Level: Parallel Count & Find using Transaction
     */
    async findAll(params: { categoryId?: string; skip: number; take: number }): Promise<{ data: Product[]; total: number }> {
        const where: Prisma.ProductWhereInput = params.categoryId ? { categoryId: params.categoryId } : {};

        const [data, total] = await prisma.$transaction([
            prisma.product.findMany({
                where,
                include: {
                    images: {
                        where: { isPrimary: true },
                        take: 1
                    },
                    category: true
                },
                skip: params.skip,
                take: params.take,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.product.count({ where })
        ]);

        return { data, total };
    }

    async findById(id: string): Promise<(Product & { images: ProductImage[] }) | null> {
        return prisma.product.findUnique({
            where: { id },
            include: {
                images: true,
                category: true
            }
        }) as any;
    }

    async findBySlug(slug: string): Promise<(Product & { images: ProductImage[] }) | null> {
        return prisma.product.findUnique({
            where: { slug },
            include: {
                images: true,
                category: true
            }
        }) as any;
    }

    async delete(id: string): Promise<Product> {
        return prisma.product.delete({
            where: { id }
        });
    }
}
