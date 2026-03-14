import { Router } from 'express';
import { protect, authorize } from '../../common/middleware/auth.middleware';
import { container } from '../../common/container';

const router = Router();
const controller = container.discountController;

// Admin only routes for management
router.use(protect, authorize('ADMIN'));

router.post('/', controller.createDiscount);
router.patch('/:id', controller.updateDiscount);
router.get('/', controller.getAllDiscounts);
router.delete('/:id', controller.deleteDiscount);

export default router;
