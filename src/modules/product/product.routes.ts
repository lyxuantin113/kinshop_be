import { Router } from 'express';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { StorageService } from '../../common/services/storage.service';
import { upload } from '../../common/middleware/upload.middleware';
import { protect, restrictTo } from '../../common/middleware/auth.middleware';

const router = Router();

const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);
const storageService = new StorageService();
const productController = new ProductController(productService, storageService);

router.get('/', productController.getAll);
router.get('/:idOrSlug', productController.getOne);

// Protected Admin Routes
router.use(protect, restrictTo('ADMIN'));

router.post('/', productController.create);
router.post('/upload-images', upload.array('images', 5), productController.uploadImages);
router.delete('/:id', productController.delete);

export default router;
