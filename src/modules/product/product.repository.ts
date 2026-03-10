import { Product, ProductImage, Prisma } from '@prisma/client';
import prisma from '../../config/database';

export interface CreateProductInputWithImages extends Omit<Prisma.ProductUncheckedCreateInput, 'images'> {
    images?: Prisma.ProductImageCreateWithoutProductInput[];
}

export interface ProductFilterParams {
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'createdAt' | 'name';
    sortOrder?: 'asc' | 'desc';
    skip: number;
    take: number;
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
     * Advanced Dynamic Filtering & Search
     */
    async findAll(params: ProductFilterParams): Promise<{ data: Product[]; total: number }> {
        const { categoryId, search, minPrice, maxPrice, sortBy, sortOrder, skip, take } = params;

        // 1. Build Dynamic Where Clause
        const where: Prisma.ProductWhereInput = {
            // Category filter
            ...(categoryId && { categoryId }),

            // Global Search (Name or Description)
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),

            // Price Range filter
            ...((minPrice !== undefined || maxPrice !== undefined) && {
                price: {
                    ...(minPrice !== undefined && { gte: minPrice }),
                    ...(maxPrice !== undefined && { lte: maxPrice }),
                },
            }),
        };

        // 2. Execute parallel query using functional transaction for better timeout support
        const [data, total] = await prisma.$transaction(async (tx) => {
            const data = await tx.product.findMany({
                where,
                include: {
                    images: {
                        where: { isPrimary: true },
                        take: 1
                    },
                    category: true
                },
                skip,
                take,
                orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' }
            });

            const total = await tx.product.count({ where });

            return [data, total];
        }, {
            timeout: 20000 // Tăng timeout lên 20s cho kết nối từ xa
        });

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
