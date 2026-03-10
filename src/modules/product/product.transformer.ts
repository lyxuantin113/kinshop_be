import { Product, ProductImage } from '@prisma/client';
import { StorageService } from '../../common/services/storage.service';

export class ProductTransformer {
    constructor(private readonly storageService: StorageService) { }

    /**
     * Transform a single product by signing its image URLs
     */
    async transform(product: any): Promise<any> {
        if (!product) return null;

        const transformedProduct = { ...product };

        // Handle both 'images' and 'ProductImage' (Prisma names) 
        // to be resilient to different query includes
        const imageField = transformedProduct.images ? 'images' :
            transformedProduct.ProductImage ? 'ProductImage' : null;

        if (imageField && Array.isArray(transformedProduct[imageField])) {
            transformedProduct[imageField] = await Promise.all(
                transformedProduct[imageField].map(async (img: any) => ({
                    ...img,
                    url: await this.storageService.getSignedUrl(img.url)
                }))
            );
        }

        return transformedProduct;
    }

    /**
     * Transform a list of products (e.g., for pagination results)
     */
    async transformMany(result: any): Promise<any> {
        if (!result || !Array.isArray(result.data)) return result;

        const transformedData = await Promise.all(
            result.data.map((product: any) => this.transform(product))
        );

        return {
            ...result,
            data: transformedData
        };
    }
}
