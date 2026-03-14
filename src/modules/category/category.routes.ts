import { Router } from 'express';
import { protect, restrictTo } from '../../common/middleware/auth.middleware';
import { container } from '../../common/container';

const router = Router();
const categoryController = container.categoryController;

router.post('/', protect, restrictTo('ADMIN'), categoryController.create);
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getOne);
router.put('/:id', protect, restrictTo('ADMIN'), categoryController.update);
router.delete('/:id', protect, restrictTo('ADMIN'), categoryController.delete);

export default router;
