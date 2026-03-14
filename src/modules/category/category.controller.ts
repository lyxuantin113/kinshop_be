import { Request, Response } from 'express';
import { CategoryService } from './category.service';
import { CategorySchema } from './category.dto';
import { PaginationQuerySchema } from '../../common/dto/pagination.dto';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';
import { ApiResponse } from '../../common/utils/api-response';

export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    create = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = CategorySchema.parse(req.body);
        const category = await this.categoryService.createCategory(validatedData);
        return ApiResponse.success(res, category, 201);
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        const { page, limit } = PaginationQuerySchema.parse(req.query);
        const result = await this.categoryService.getAllCategories({ page, limit });
        return ApiResponse.paginated(res, result.data, result.meta);
    });

    getOne = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const category = await this.categoryService.getCategoryById(id);
        if (!category) {
            throw new AppError('Category not found', 404);
        }
        return ApiResponse.success(res, category);
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const validatedData = CategorySchema.partial().parse(req.body);
        const category = await this.categoryService.updateCategory(id, validatedData);
        return ApiResponse.success(res, category);
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await this.categoryService.deleteCategory(id);
        return ApiResponse.noContent(res);
    });
}
