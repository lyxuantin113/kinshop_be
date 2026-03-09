import { Request, Response } from 'express';
import { ProductService } from './product.service';
import { CreateProductSchema, ProductQuerySchema } from './product.dto';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';

export class ProductController {
    constructor(private readonly productService: ProductService) { }

    create = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = CreateProductSchema.parse(req.body);
        const product = await this.productService.createProduct(validatedData);
        res.status(201).json({ data: product });
    });

    /**
     * Senior Level: Clean Controller with advanced query validation
     */
    getAll = asyncHandler(async (req: Request, res: Response) => {
        // 1. Validate full query complex object (page, limit, search, price range, etc.)
        const query = ProductQuerySchema.parse(req.query);

        // 2. Call service with typed query
        const result = await this.productService.getAllProducts(query);

        // 3. Standardized Response
        res.status(200).json(result);
    });

    getOne = asyncHandler(async (req: Request, res: Response) => {
        const idOrSlug = req.params.idOrSlug as string;
        const product = await this.productService.getProductDetails(idOrSlug);
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        res.status(200).json({ data: product });
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await this.productService.deleteProduct(id);
        res.status(204).send();
    });
}
