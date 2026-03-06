import { Category } from '@prisma/client';
import { CategoryRepository } from './category.repository';
import { CategoryInput } from './category.dto';
import { PaginatedResponse, getPaginationMeta } from '../../common/utils/pagination';

export class CategoryService {
    constructor(private readonly categoryRepository: CategoryRepository) { }

    async createCategory(data: CategoryInput): Promise<Category> {
        const existing = await this.categoryRepository.findBySlug(data.slug);
        if (existing) {
            throw new Error('Category with this slug already exists');
        }
        return this.categoryRepository.create(data);
    }

    async getAllCategories(params: { page: number; limit: number }): Promise<PaginatedResponse<Category>> {
        const { page, limit } = params;
        const skip = (page - 1) * limit;

        const { data, total } = await this.categoryRepository.findAll({
            skip,
            take: limit
        });

        return {
            data,
            meta: getPaginationMeta(total, page, limit)
        };
    }

    async getCategoryById(id: string): Promise<Category | null> {
        return this.categoryRepository.findById(id);
    }

    async updateCategory(id: string, data: Partial<CategoryInput>): Promise<Category> {
        return this.categoryRepository.update(id, data);
    }

    async deleteCategory(id: string): Promise<Category> {
        return this.categoryRepository.delete(id);
    }
}
