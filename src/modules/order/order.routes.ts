import { Router } from 'express';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { ShippingService } from './shipping.service';
import { CartRepository } from '../cart/cart.repository';
import { ProductRepository } from '../product/product.repository';
import { protect, authorize } from '../../common/middleware/auth.middleware';

import { DiscountService } from '../discount/discount.service';
import { DiscountRepository } from '../discount/discount.repository';

import { SystemConfigService } from '../system-config/system-config.service';
import { SystemConfigRepository } from '../system-config/system-config.repository';

const router = Router();

const orderRepository = new OrderRepository();
const cartRepository = new CartRepository();
const productRepository = new ProductRepository();
const systemConfigRepository = new SystemConfigRepository();
const systemConfigService = new SystemConfigService(systemConfigRepository);
const shippingService = new ShippingService(systemConfigService);
const discountRepository = new DiscountRepository();
const discountService = new DiscountService(discountRepository);
const orderService = new OrderService(orderRepository, cartRepository, productRepository, shippingService, discountService);
const orderController = new OrderController(orderService);

router.use(protect);

// Public User Routes
router.post('/preview-checkout', orderController.previewCheckout);
router.post('/checkout', orderController.checkout);
router.get('/my-orders', orderController.getMyOrders);

// Admin Routes (Specific routes first)
router.get('/admin/stats', authorize('ADMIN'), orderController.getStats);
router.get('/admin/all', authorize('ADMIN'), orderController.getAllOrders);
router.get('/admin/:orderId', authorize('ADMIN'), orderController.getAdminOrder);
router.patch('/admin/:orderId/status', authorize('ADMIN'), orderController.updateStatus);

// Generic Detail Route (Last)
router.get('/:orderId', orderController.getOrder);

export default router;
