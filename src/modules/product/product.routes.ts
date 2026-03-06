import { Router } from 'express';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';

import { protect, restrictTo } from '../../common/middleware/auth.middleware';

const router = Router();

const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);
const productController = new ProductController(productService);

router.post('/', protect, restrictTo('ADMIN'), productController.create);
router.get('/', productController.getAll);
router.get('/:idOrSlug', productController.getOne);
router.delete('/:id', protect, restrictTo('ADMIN'), productController.delete);

export default router;
