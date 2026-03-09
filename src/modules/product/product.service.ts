import { Product, ProductImage } from '@prisma/client';
import { ProductRepository, CreateProductInputWithImages } from './product.repository';
import { CreateProductInput, ProductQuery } from './product.dto';
import { PaginatedResponse, getPaginationMeta } from '../../common/utils/pagination';

export class ProductService {
    constructor(private readonly productRepository: ProductRepository) { }

    async createProduct(data: CreateProductInput): Promise<Product & { images: ProductImage[] }> {
        const existing = await this.productRepository.findBySlug(data.slug);
        if (existing) {
            throw new Error('Product with this slug already exists');
        }

        const { images, ...productData } = data;
        const repositoryInput: CreateProductInputWithImages = {
            ...productData,
            price: data.price as any,
            images: images as any
        };

        return this.productRepository.create(repositoryInput);
    }

    /**
     * Senior Level: Optimized pagination + dynamic filtering logic
     */
    async getAllProducts(query: ProductQuery): Promise<PaginatedResponse<Product>> {
        const { page, limit, ...filters } = query;
        const skip = (page - 1) * limit;

        const { data, total } = await this.productRepository.findAll({
            ...filters,
            skip,
            take: limit
        });

        return {
            data,
            meta: getPaginationMeta(total, page, limit)
        };
    }

    async getProductDetails(idOrSlug: string): Promise<(Product & { images: ProductImage[] }) | null> {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

        if (isUuid) {
            return this.productRepository.findById(idOrSlug);
        }
        return this.productRepository.findBySlug(idOrSlug);
    }

    async deleteProduct(id: string): Promise<Product> {
        return this.productRepository.delete(id);
    }
}
