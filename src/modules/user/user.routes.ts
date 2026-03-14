import { Router } from 'express';
import { protect, restrictTo } from '../../common/middleware/auth.middleware';
import { authRateLimiter } from '../../common/middleware/rate-limit.middleware';
import { container } from '../../common/container';

const router = Router();
const userController = container.userController;

router.post('/register', authRateLimiter, userController.register);
router.post('/login', authRateLimiter, userController.login);
router.post('/logout', userController.logout);
router.post('/refresh', authRateLimiter, userController.refresh);
router.get('/', protect, restrictTo('ADMIN'), userController.getAll);
router.delete('/:id', protect, restrictTo('ADMIN'), userController.delete);

export default router;
