import { Request, Response } from 'express';
import { CategoryService } from './category.service';
import { CategorySchema } from './category.dto';
import { PaginationQuerySchema } from '../../common/dto/pagination.dto';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';

export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    create = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = CategorySchema.parse(req.body);
        const category = await this.categoryService.createCategory(validatedData);
        res.status(201).json({ data: category });
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        const { page, limit } = PaginationQuerySchema.parse(req.query);
        const result = await this.categoryService.getAllCategories({ page, limit });
        res.status(200).json(result);
    });

    getOne = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const category = await this.categoryService.getCategoryById(id);
        if (!category) {
            throw new AppError('Category not found', 404);
        }
        res.status(200).json({ data: category });
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const category = await this.categoryService.updateCategory(id, req.body);
        res.status(200).json({ data: category });
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await this.categoryService.deleteCategory(id);
        res.status(204).send();
    });
}
