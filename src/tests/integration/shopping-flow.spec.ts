import 'dotenv/config';
import { CartService } from '../../modules/cart/cart.service';
import { CartRepository } from '../../modules/cart/cart.repository';
import { OrderService } from '../../modules/order/order.service';
import { OrderRepository } from '../../modules/order/order.repository';
import { ProductRepository } from '../../modules/product/product.repository';
import { ShippingService } from '../../modules/order/shipping.service';
import { DiscountService } from '../../modules/discount/discount.service';
import { DiscountRepository } from '../../modules/discount/discount.repository';
import { cleanupDatabase, createTestUser, createTestCategory, createTestProduct, createTestDiscount } from '../test-utils';
import prisma, { pool } from '../../config/database';
import redis from '../../config/redis';

describe('Shopping Flow Integration', () => {
    let cartService: CartService;
    let orderService: OrderService;
    let cartRepository: CartRepository;
    let orderRepository: OrderRepository;
    let productRepository: ProductRepository;
    let shippingService: ShippingService;
    let discountService: DiscountService;

    beforeAll(async () => {
        cartRepository = new CartRepository();
        orderRepository = new OrderRepository();
        productRepository = new ProductRepository();
        shippingService = new ShippingService();
        const discountRepository = new DiscountRepository();
        discountService = new DiscountService(discountRepository);

        cartService = new CartService(cartRepository);
        orderService = new OrderService(orderRepository, cartRepository, productRepository, shippingService, discountService);
    });

    beforeEach(async () => {
        await cleanupDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
        await pool.end();
        await redis.quit();
    });

    describe('Cart Operations', () => {
        it('should calculate correct subtotal when adding products', async () => {
            const user = await createTestUser();
            const cat = await createTestCategory();
            const prod = await createTestProduct(cat.id, 'Mouse', 50, 100);

            await cartService.addToCart(user.id, { productId: prod.id, quantity: 2 });
            const cart = await cartService.getOrCreateCart(user.id);

            expect(cart.items).toHaveLength(1);
            expect(Number(cart.items[0].product.price)).toBe(50);
            expect(cart.items[0].quantity).toBe(2);
        });
    });

    describe('Concurrency & Stock Protection', () => {
        it('should prevent negative stock when multiple users checkout simultaneously', async () => {
            const cat = await createTestCategory();
            const product = await createTestProduct(cat.id, 'Limited Item', 100, 3); // Only 3 items

            // Create 5 concurrent users
            const users = await Promise.all([
                createTestUser('u1@test.com'),
                createTestUser('u2@test.com'),
                createTestUser('u3@test.com'),
                createTestUser('u4@test.com'),
                createTestUser('u5@test.com'),
            ]);

            // All users add 1 item to their cart
            for (const user of users) {
                await cartService.addToCart(user.id, { productId: product.id, quantity: 1 });
            }

            // Simulate simultaneous checkout
            const results = await Promise.allSettled(
                users.map(user => orderService.checkout(user.id))
            );

            const fulfilled = results.filter(r => r.status === 'fulfilled');
            const rejected = results.filter(r => r.status === 'rejected');

            // Only 3 should succeed since stock is 3
            expect(fulfilled.length).toBe(3);
            expect(rejected.length).toBe(2);

            // Verify stock in DB is exactly 0, not negative
            const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
            expect(updatedProduct?.stock).toBe(0);
        });
    });

    describe('Discount System', () => {
        it('should correctly apply a percentage discount to the order', async () => {
            const user = await createTestUser();
            const cat = await createTestCategory();
            const prod = await createTestProduct(cat.id, 'Keyboard', 50, 10);
            await createTestDiscount('SAVE10', 'PERCENTAGE', 10); // 10% off

            await cartService.addToCart(user.id, { productId: prod.id, quantity: 1 });
            const order = await orderService.checkout(user.id, 'SAVE10');

            // Subtotal 50 + Shipping 5 - Discount 5 = 50
            expect(Number(order.subtotal)).toBe(50);
            expect(Number(order.discountAmount)).toBe(5);
            expect(Number(order.shippingFee)).toBe(5);
            expect(Number(order.totalAmount)).toBe(50);
        });

        it('should respect coupon usage limit under high concurrency', async () => {
            const user1 = await createTestUser('u1@test.com');
            const user2 = await createTestUser('u2@test.com');
            const cat = await createTestCategory();
            const prod = await createTestProduct(cat.id, 'Item', 100, 100);

            const discount = await prisma.discount.create({
                data: {
                    code: 'LIMITED',
                    type: 'FIXED_AMOUNT',
                    value: 10,
                    scope: 'GLOBAL',
                    startDate: new Date(Date.now() - 1000),
                    endDate: new Date(Date.now() + 100000),
                    usageLimit: 1, // Only 1 use allowed
                }
            });

            await cartService.addToCart(user1.id, { productId: prod.id, quantity: 1 });
            await cartService.addToCart(user2.id, { productId: prod.id, quantity: 1 });

            // Simultaneous checkout using the same coupon
            const results = await Promise.allSettled([
                orderService.checkout(user1.id, 'LIMITED'),
                orderService.checkout(user2.id, 'LIMITED')
            ]);

            const fulfilled = results.filter(r => r.status === 'fulfilled');
            expect(fulfilled.length).toBe(1); // Only one should get the discount

            const updatedDiscount = await prisma.discount.findUnique({ where: { id: discount.id } });
            expect(updatedDiscount?.usedCount).toBe(1);
        });
    });

    describe('Order History', () => {
        it('should list all orders for a specific user', async () => {
            const user = await createTestUser();
            const cat = await createTestCategory();
            const prod = await createTestProduct(cat.id, 'Laptop', 1000, 10);

            await cartService.addToCart(user.id, { productId: prod.id, quantity: 1 });
            await orderService.checkout(user.id);

            const orders = await orderService.getMyOrders(user.id);
            expect(orders).toHaveLength(1);
            expect(orders[0].userId).toBe(user.id);
        });
    });
});
