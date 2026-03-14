import { Router } from 'express';
import { protect, authorize } from '../../common/middleware/auth.middleware';
import { container } from '../../common/container';

const router = Router();
const orderController = container.orderController;

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
