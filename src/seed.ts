import 'dotenv/config';
import { Role, DiscountType, DiscountScope } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import prisma from './config/database';

const BUCKET_URL = `https://storage.googleapis.com/${process.env.GCP_BUCKET_NAME}`;

// Map Categories to Unsplash keywords for better seed images
const CATEGORY_IMAGE_KEYWORDS: Record<string, string> = {
    'Electronics': 'electronics,tech',
    'Clothing': 'fashion,clothing',
    'Home & Kitchen': 'kitchen,interior',
    'Books': 'books,library',
    'Beauty': 'cosmetics,beauty',
};

function getPlaceholderImage(categoryName: string): string {
    const keyword = CATEGORY_IMAGE_KEYWORDS[categoryName] || 'product';
    return `https://images.unsplash.com/photo-${faker.string.nanoid(10)}?q=80&w=800&auto=format&fit=crop&sig=${faker.string.nanoid(5)}&keywords=${keyword}`;
}

async function main() {
    console.log('🌱 Starting seed process...');

    // 0. Cleanup existing data to avoid duplication and fix image URLs
    console.log('🧹 Cleaning up database...');
    
    // Dependent tables first (Children)
    await prisma.orderItem.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.productImage.deleteMany();
    
    // Parent tables
    await prisma.order.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.discount.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✅ Cleanup done.');

    // 1. System Configs
    const configs = [
        { key: 'SHIPPING_BASE_FEE', value: '30000', description: 'Base shipping fee' },
        { key: 'SHIPPING_FREE_THRESHOLD', value: '500000', description: 'Free shipping threshold' },
    ];

    for (const config of configs) {
        await prisma.systemConfig.upsert({
            where: { key: config.key },
            update: {},
            create: config,
        });
    }
    console.log('✅ System configs initialized.');

    // 2. Default Admin & User
    const adminEmail = 'admin@kinshop.com';
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password: hashedPassword,
            name: 'Super Admin',
            role: Role.ADMIN,
        },
    });
    console.log('✅ Default Admin created: admin@kikinshop.com');

    const userEmail = 'user@kinshop.com';
    const userPassword = await bcrypt.hash('user123', 10);
    await prisma.user.upsert({
        where: { email: userEmail },
        update: {},
        create: {
            email: userEmail,
            password: userPassword,
            name: 'User',
            role: Role.USER,
        },
    });
    console.log('✅ Default User created: user@kikinshop.com');

    // 3. Categories
    const categoryNames = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Beauty'];
    const categories = [];

    for (const name of categoryNames) {
        const slug = faker.helpers.slugify(name).toLowerCase();
        const category = await prisma.category.upsert({
            where: { slug },
            update: {},
            create: {
                name,
                slug,
                description: faker.commerce.productDescription(),
            },
        });
        categories.push(category);
    }
    console.log(`✅ ${categories.length} Categories initialized.`);

    // 4. Products
    console.log('📦 Creating products...');
    for (const category of categories) {
        // Tạo 5-10 sản phẩm mỗi category
        const productCount = faker.number.int({ min: 50, max: 80 });

        for (let i = 0; i < productCount; i++) {
            const productName = faker.commerce.productName();
            const product = await prisma.product.create({
                data: {
                    name: productName,
                    slug: `${faker.helpers.slugify(productName).toLowerCase()}-${faker.string.nanoid(5)}`,
                    description: faker.commerce.productDescription(),
                    price: faker.commerce.price({ min: 10000, max: 2000000 }),
                    stock: faker.number.int({ min: 0, max: 100 }),
                    categoryId: category.id,
                    images: {
                        create: [
                            {
                                url: getPlaceholderImage(category.name),
                                isPrimary: true,
                                altText: productName,
                            },
                            {
                                url: getPlaceholderImage(category.name),
                                isPrimary: false,
                                altText: `${productName} secondary`,
                            }
                        ]
                    }
                }
            });
        }
    }
    console.log('✅ Products and images initialized.');

    // 5. Global Discounts
    await prisma.discount.upsert({
        where: { code: 'HELLO2024' },
        update: {},
        create: {
            code: 'HELLO2024',
            type: DiscountType.PERCENTAGE,
            value: 10,
            scope: DiscountScope.GLOBAL,
            minOrderAmount: 100000,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
            isActive: true,
        }
    });
    console.log('✅ Global discount HELLO2024 created.');

    console.log('🚀 Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
