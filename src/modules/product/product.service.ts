import { Product, ProductImage } from '@prisma/client';
import { ProductRepository, CreateProductInputWithImages } from './product.repository';
import { CreateProductInput, ProductQuery } from './product.dto';
import { PaginatedResponse, getPaginationMeta } from '../../common/utils/pagination';
import { StorageService } from '../../common/services/storage.service';

export class ProductService {
    constructor(
        private readonly productRepository: ProductRepository,
        private readonly storageService: StorageService
    ) { }

    async createProduct(data: CreateProductInput): Promise<Product & { images: ProductImage[] }> {
        const existing = await this.productRepository.findBySlug(data.slug);
        if (existing) {
            throw new Error('Product with this slug already exists');
        }

        const { images, ...productData } = data;

        // Clean URLs before saving to DB
        const cleanedImages = images?.map(img => ({
            ...img,
            url: this.storageService.getCleanUrl(img.url)
        }));

        const repositoryInput: CreateProductInputWithImages = {
            ...productData,
            price: data.price as any,
            images: cleanedImages as any
        };

        return this.productRepository.create(repositoryInput);
    }

    /**
     * Optimized pagination + dynamic filtering logic
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

    async updateProduct(id: string, data: Partial<CreateProductInput>): Promise<Product & { images: ProductImage[] }> {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }

        if (data.slug && data.slug !== product.slug) {
            const existing = await this.productRepository.findBySlug(data.slug);
            if (existing) {
                throw new Error('Product with this slug already exists');
            }
        }

        const { images, ...productData } = data;

        // Clean URLs before saving to DB
        const cleanedImages = images?.map(img => ({
            ...img,
            url: this.storageService.getCleanUrl(img.url)
        }));

        return this.productRepository.update(id, {
            ...productData,
            price: productData.price as any,
            images: cleanedImages as any
        });
    }

    async deleteProduct(id: string): Promise<Product> {
        return this.productRepository.delete(id);
    }
}
