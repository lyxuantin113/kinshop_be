import { Router } from 'express';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { protect, restrictTo } from '../../common/middleware/auth.middleware';
import { authRateLimiter } from '../../common/middleware/rate-limit.middleware';

const router = Router();

// Manual Dependency Injection Wiring
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.post('/register', authRateLimiter, userController.register);
router.post('/login', authRateLimiter, userController.login);
router.post('/logout', protect, userController.logout);
router.post('/refresh', authRateLimiter, userController.refresh);
router.get('/', protect, restrictTo('ADMIN'), userController.getAll);

export default router;
