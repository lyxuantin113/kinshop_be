import { Router } from 'express';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';

const router = Router();

const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);
const productController = new ProductController(productService);

router.post('/', productController.create);
router.get('/', productController.getAll);
router.get('/:idOrSlug', productController.getOne);
router.delete('/:id', productController.delete);

export default router;
