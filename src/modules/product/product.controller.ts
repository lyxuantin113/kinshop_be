import { Request, Response } from 'express';
import { ProductService } from './product.service';
import { CreateProductSchema } from './product.dto';
import { PaginationQuerySchema } from '../../common/dto/pagination.dto';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';

export class ProductController {
    constructor(private readonly productService: ProductService) { }

    create = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = CreateProductSchema.parse(req.body);
        const product = await this.productService.createProduct(validatedData);
        res.status(201).json({ data: product });
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        const { page, limit } = PaginationQuerySchema.parse(req.query);
        const categoryId = req.query.categoryId as string | undefined;

        const result = await this.productService.getAllProducts({
            page,
            limit,
            categoryId
        });

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
