import { Request, Response } from 'express';
import { CategoryService } from './category.service';
import { CategorySchema } from './category.dto';
import { PaginationQuerySchema } from '../../common/dto/pagination.dto';

export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    create = async (req: Request, res: Response) => {
        try {
            const validatedData = CategorySchema.parse(req.body);
            const category = await this.categoryService.createCategory(validatedData);
            res.status(201).json({ data: category });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ message: 'Validation Error', errors: error.errors });
            }
            res.status(400).json({ message: error.message });
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            const { page, limit } = PaginationQuerySchema.parse(req.query);
            const result = await this.categoryService.getAllCategories({ page, limit });
            res.status(200).json(result);
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ message: 'Invalid pagination parameters' });
            }
            res.status(500).json({ message: error.message });
        }
    };

    getOne = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            const category = await this.categoryService.getCategoryById(id);
            if (!category) return res.status(404).json({ message: 'Category not found' });
            res.status(200).json({ data: category });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            const category = await this.categoryService.updateCategory(id, req.body);
            res.status(200).json({ data: category });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            await this.categoryService.deleteCategory(id);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    };
}
