import 'dotenv/config';
import request from 'supertest';
import { cleanupDatabase, createTestUser, createTestAdmin, createTestCategory, createTestProduct, createTestDiscount } from '../test-utils';
import prisma from '../../config/database';
import { JwtUtil } from '../../common/utils/jwt.util';
import { OrderStatus } from '@prisma/client';
import app from '../../app';

jest.mock('../../config/redis', () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn()
}));

describe('Admin Dashboard Integration Tests', () => {
    let adminToken: string;
    let userToken: string;
    let adminUser: any;
    let normalUser: any;

    beforeEach(async () => {
        await cleanupDatabase();

        adminUser = await createTestAdmin();
        normalUser = await createTestUser('normal@example.com');

        adminToken = JwtUtil.generateAccessToken({ userId: adminUser.id, role: adminUser.role });
        userToken = JwtUtil.generateAccessToken({ userId: normalUser.id, role: normalUser.role });
    });

    afterAll(async () => {
        await cleanupDatabase();
        await prisma.$disconnect();
    });

    describe('RBAC Verification', () => {
        it('should forbid a normal USER from accessing admin order routes', async () => {
            const res = await request(app)
                .get('/api/orders/admin/all')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });

        it('should allow an ADMIN to access admin order routes', async () => {
            const res = await request(app)
                .get('/api/orders/admin/all')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
        });
    });

    describe('Order Management', () => {
        let testOrder: any;

        beforeEach(async () => {
            const category = await createTestCategory();
            const product = await createTestProduct(category.id);

            testOrder = await prisma.order.create({
                data: {
                    userId: normalUser.id,
                    totalAmount: 1000,
                    subtotal: 1000,
                    shippingFee: 0,
                    status: OrderStatus.PENDING,
                    items: {
                        create: [{ productId: product.id, quantity: 1, price: 1000 }]
                    }
                }
            });
        });

        it('should update order status correctly', async () => {
            const res = await request(app)
                .patch(`/api/orders/admin/${testOrder.id}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: OrderStatus.SHIPPED });

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe(OrderStatus.SHIPPED);
        });

        it('should prevent invalid status transitions (e.g., CANCELLED -> DELIVERED)', async () => {
            await prisma.order.update({
                where: { id: testOrder.id },
                data: { status: OrderStatus.CANCELLED }
            });

            const res = await request(app)
                .patch(`/api/orders/admin/${testOrder.id}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: OrderStatus.DELIVERED });

            expect(res.status).toBe(400);
        });

        it('should return dashboard stats', async () => {
            const res = await request(app)
                .get('/api/orders/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('revenue');
            expect(res.body.data).toHaveProperty('orders');
        });
    });

    describe('System Configuration', () => {
        it('should allow admin to update system configurations', async () => {
            const res = await request(app)
                .patch('/api/system-configs/SHIPPING_BASE_FEE')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ value: '50', description: 'Updated shipping fee' });

            expect(res.status).toBe(200);

            const config = await prisma.systemConfig.findUnique({
                where: { key: 'SHIPPING_BASE_FEE' }
            });
            expect(config?.value).toBe('50');
        });

        it('should reflect config changes in shipping calculation', async () => {
            const thresholdRes = await request(app)
                .patch('/api/system-configs/SHIPPING_FREE_THRESHOLD')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ value: '10000' });
            expect(thresholdRes.status).toBe(200);

            const feeRes = await request(app)
                .patch('/api/system-configs/SHIPPING_BASE_FEE')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ value: '99' });
            expect(feeRes.status).toBe(200);

            const category = await createTestCategory('ShippingTest');
            const product = await createTestProduct(category.id, 'Cheap Item', 100);

            const cartRes = await request(app)
                .post('/api/cart/add')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ productId: product.id, quantity: 1 });
            expect(cartRes.status).toBe(200);

            const checkoutRes = await request(app)
                .post('/api/orders/checkout')
                .set('Authorization', `Bearer ${userToken}`);

            if (checkoutRes.status !== 201) {
                console.error('Checkout failed in reflect config test:', JSON.stringify(checkoutRes.body, null, 2));
            }

            expect(checkoutRes.status).toBe(201);
            expect(Number(checkoutRes.body.data.shippingFee)).toBe(99);
        });
    });

    describe('Discount Management', () => {
        it('should create and delete discount coupons', async () => {
            const createRes = await request(app)
                .post('/api/discounts')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    code: 'NEWYEAR2024',
                    type: 'PERCENTAGE',
                    value: 20,
                    scope: 'GLOBAL',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 86400000),
                    minOrderAmount: 0
                });

            expect(createRes.status).toBe(201);
            const discountId = createRes.body.data.id;

            const deleteRes = await request(app)
                .delete(`/api/discounts/${discountId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(deleteRes.status).toBe(204);
        });
    });
});
