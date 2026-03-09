import prisma from '../config/database';

export const cleanupDatabase = async () => {
    const tablenames = await prisma.$queryRaw<
        Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE '_prisma_migrations';`;

    for (const { tablename } of tablenames) {
        if (tablename !== '_prisma_migrations') {
            try {
                await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
            } catch (error) {
                console.log({ error });
            }
        }
    }
};

export const createTestUser = async (email: string = 'test@example.com') => {
    return await prisma.user.create({
        data: {
            email,
            password: 'hashed_password',
            name: 'Test User',
            role: 'USER',
        },
    });
};

export const createTestCategory = async (name: string = 'Electronics') => {
    return await prisma.category.create({
        data: {
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
        },
    });
};

export const createTestProduct = async (categoryId: string, name: string = 'Laptop', price: number = 1000, stock: number = 10) => {
    return await prisma.product.create({
        data: {
            name,
            slug: `${name.toLowerCase()}-${Math.random()}`,
            price,
            stock,
            categoryId,
        },
    });
};

export const createTestDiscount = async (code: string, type: 'PERCENTAGE' | 'FIXED_AMOUNT', value: number, scope: 'GLOBAL' | 'PRODUCT' | 'CATEGORY' = 'GLOBAL') => {
    return await prisma.discount.create({
        data: {
            code: code.toUpperCase(),
            type,
            value: value,
            scope,
            startDate: new Date(Date.now() - 86400000), // Yesterday
            endDate: new Date(Date.now() + 86400000 * 7), // Next week
            usageLimit: 10,
        },
    });
};
