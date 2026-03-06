import { Router } from 'express';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

const router = Router();

// Manual Dependency Injection Wiring
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/', userController.getAll);

export default router;
