import { Router } from 'express';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { protect } from '../../common/middleware/auth.middleware';

const router = Router();

const cartRepository = new CartRepository();
const cartService = new CartService(cartRepository);
const cartController = new CartController(cartService);

// All cart routes are protected
router.use(protect);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.patch('/update/:productId', cartController.updateQuantity);
router.delete('/remove/:productId', cartController.removeItem);
router.delete('/clear', cartController.clearCart);

export default router;
