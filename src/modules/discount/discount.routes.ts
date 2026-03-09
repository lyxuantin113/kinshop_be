import { Router } from 'express';
import { DiscountController } from './discount.controller';
import { DiscountService } from './discount.service';
import { DiscountRepository } from './discount.repository';
import { protect, authorize } from '../../common/middleware/auth.middleware';

const router = Router();
const repository = new DiscountRepository();
const service = new DiscountService(repository);
const controller = new DiscountController(service);

// Admin only routes for management
router.use(protect, authorize('ADMIN'));

router.post('/', controller.createDiscount);
router.get('/', controller.getAllDiscounts);
router.delete('/:id', controller.deleteDiscount);

export default router;
