import prisma from '../config/database';

export const cleanupDatabase = async () => {
    const tablenames = await prisma.$queryRaw<
        Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE '_prisma_migrations';`;

    const tables = tablenames
        .map(t => `"${t.tablename}"`)
        .filter(t => t !== '"_prisma_migrations"')
        .join(', ');

    if (tables) {
        try {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
        } catch (error) {
            console.error('Cleanup error:', error);
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

export const createTestAdmin = async (email: string = 'admin@example.com') => {
    return await prisma.user.create({
        data: {
            email,
            password: 'hashed_password',
            name: 'Admin User',
            role: 'ADMIN',
        },
    });
};

export const createTestCategory = async (name: string = 'Electronics') => {
    const uniqueName = `${name}-${Math.random()}`;
    return await prisma.category.create({
        data: {
            name: uniqueName,
            slug: `${uniqueName.toLowerCase().replace(/\s+/g, '-')}-${Math.random()}`,
        },
    });
};

export const createTestProduct = async (categoryId: string, name: string = 'Laptop', price: number = 1000, stock: number = 10) => {
    const uniqueName = `${name}-${Math.random()}`;
    return await prisma.product.create({
        data: {
            name: uniqueName,
            slug: `${uniqueName.toLowerCase()}-${Math.random()}`,
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
