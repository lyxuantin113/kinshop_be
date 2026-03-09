import { Router } from 'express';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { CartRepository } from '../cart/cart.repository';
import { ProductRepository } from '../product/product.repository';
import { protect } from '../../common/middleware/auth.middleware';

const router = Router();

const orderRepository = new OrderRepository();
const cartRepository = new CartRepository();
const productRepository = new ProductRepository();
const orderService = new OrderService(orderRepository, cartRepository, productRepository);
const orderController = new OrderController(orderService);

router.use(protect);

router.post('/checkout', orderController.checkout);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:orderId', orderController.getOrder);

export default router;
