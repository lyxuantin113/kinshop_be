import { Router } from 'express';
import { protect } from '../../common/middleware/auth.middleware';
import { container } from '../../common/container';

const router = Router();
const cartController = container.cartController;

// All cart routes are protected
router.use(protect);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.patch('/update/:productId', cartController.updateQuantity);
router.delete('/remove/:productId', cartController.removeItem);
router.delete('/clear', cartController.clearCart);

export default router;
