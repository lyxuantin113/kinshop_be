import { Router } from 'express';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryRepository } from './category.repository';

import { protect, restrictTo } from '../../common/middleware/auth.middleware';

const router = Router();

const categoryRepository = new CategoryRepository();
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

router.post('/', protect, restrictTo('ADMIN'), categoryController.create);
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getOne);
router.put('/:id', protect, restrictTo('ADMIN'), categoryController.update);
router.delete('/:id', protect, restrictTo('ADMIN'), categoryController.delete);

export default router;
