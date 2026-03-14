import { Router } from 'express';
import { upload } from '../../common/middleware/upload.middleware';
import { protect, restrictTo } from '../../common/middleware/auth.middleware';
import { container } from '../../common/container';

const router = Router();
const productController = container.productController;

router.get('/', productController.getAll);
router.get('/:idOrSlug', productController.getOne);

// Protected Admin Routes
router.use(protect, restrictTo('ADMIN'));

router.post('/', productController.create);
router.post('/upload-images', upload.array('images', 5), productController.uploadImages);
router.patch('/:id', productController.update);
router.delete('/:id', productController.delete);

export default router;
