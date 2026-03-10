import { Router } from 'express';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { StorageService } from '../../common/services/storage.service';
import { upload } from '../../common/middleware/upload.middleware';
import { protect, restrictTo } from '../../common/middleware/auth.middleware';

const router = Router();

const storageService = new StorageService();
const productRepository = new ProductRepository();
const productService = new ProductService(productRepository, storageService);
const productController = new ProductController(productService, storageService);

router.get('/', productController.getAll);
router.get('/:idOrSlug', productController.getOne);

// Protected Admin Routes
router.use(protect, restrictTo('ADMIN'));

router.post('/', productController.create);
router.post('/upload-images', upload.array('images', 5), productController.uploadImages);
router.patch('/:id', productController.update);
router.delete('/:id', productController.delete);

export default router;
