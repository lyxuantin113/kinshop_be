import { Request, Response } from 'express';
import { ProductService } from './product.service';
import { CreateProductSchema } from './product.dto';
import { PaginationQuerySchema } from '../../common/dto/pagination.dto';

export class ProductController {
    constructor(private readonly productService: ProductService) { }

    create = async (req: Request, res: Response) => {
        try {
            const validatedData = CreateProductSchema.parse(req.body);
            const product = await this.productService.createProduct(validatedData);
            res.status(201).json({ data: product });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ message: 'Validation Error', errors: error.errors });
            }
            res.status(400).json({ message: error.message });
        }
    };

    /**
     * Senior Level: Clean Controller with query validation
     */
    getAll = async (req: Request, res: Response) => {
        try {
            // 1. Validate query params (page, limit)
            const { page, limit } = PaginationQuerySchema.parse(req.query);
            const categoryId = req.query.categoryId as string | undefined;

            // 2. Call service
            const result = await this.productService.getAllProducts({
                page,
                limit,
                categoryId
            });

            // 3. Standardized Response
            res.status(200).json(result);
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ message: 'Invalid pagination parameters', errors: error.errors });
            }
            res.status(500).json({ message: error.message });
        }
    };

    getOne = async (req: Request, res: Response) => {
        try {
            const idOrSlug = req.params.idOrSlug as string;
            const product = await this.productService.getProductDetails(idOrSlug);
            if (!product) return res.status(404).json({ message: 'Product not found' });
            res.status(200).json({ data: product });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            await this.productService.deleteProduct(id);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    };
}
