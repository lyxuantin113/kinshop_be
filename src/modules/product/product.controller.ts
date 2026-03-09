import { Request, Response } from 'express';
import { ProductService } from './product.service';
import { CreateProductSchema, ProductQuerySchema } from './product.dto';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';
import { StorageService } from '../../common/services/storage.service';

export class ProductController {
    constructor(
        private readonly productService: ProductService,
        private readonly storageService: StorageService
    ) { }

    create = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = CreateProductSchema.parse(req.body);
        const product = await this.productService.createProduct(validatedData);
        res.status(201).json({ data: product });
    });

    /**
     * Handle multi-image upload to GCS
     */
    uploadImages = asyncHandler(async (req: Request, res: Response) => {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            throw new AppError('No images provided', 400);
        }

        // Upload all files in parallel
        const uploadPromises = files.map(file =>
            this.storageService.uploadFile(file, 'products')
        );

        const imageUrls = await Promise.all(uploadPromises);

        res.status(200).json({
            status: 'success',
            data: imageUrls
        });
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        const query = ProductQuerySchema.parse(req.query);
        const result = await this.productService.getAllProducts(query);
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
