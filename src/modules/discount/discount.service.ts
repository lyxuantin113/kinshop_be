import { Discount, DiscountType, DiscountScope, CartItem } from '@prisma/client';
import { CreateDiscountDto } from './discount.dto';
import { PaginatedResponse, getPaginationMeta } from '../../common/utils/pagination';
import { DiscountRepository } from './discount.repository';
import { AppError } from '../../common/errors/app-error';

export class DiscountService {
    constructor(private readonly discountRepository: DiscountRepository) { }

    async validateDiscount(code: string, subtotal: number, cartItems: any[]): Promise<Discount> {
        const discount = await this.discountRepository.findByCode(code);

        if (!discount) {
            throw new AppError('Invalid coupon code', 400);
        }

        if (!discount.isActive) {
            throw new AppError('This coupon is no longer active', 400);
        }

        const now = new Date();
        if (now < discount.startDate || now > discount.endDate) {
            throw new AppError('This coupon has expired or is not yet valid', 400);
        }

        if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit) {
            throw new AppError('This coupon has reached its usage limit', 400);
        }

        if (subtotal < Number(discount.minOrderAmount)) {
            throw new AppError(`Minimum order amount of $${discount.minOrderAmount} required for this coupon`, 400);
        }

        if (discount.scope === DiscountScope.PRODUCT) {
            const hasProduct = cartItems.some(item => item.productId === discount.productId);
            if (!hasProduct) {
                throw new AppError('This coupon is not applicable to the products in your cart', 400);
            }
        } else if (discount.scope === DiscountScope.CATEGORY) {
            const hasCategory = cartItems.some(item => item.product.categoryId === discount.categoryId);
            if (!hasCategory) {
                throw new AppError('This coupon is not applicable to the categories in your cart', 400);
            }
        }

        return discount;
    }

    calculateDiscountAmount(discount: Discount, subtotal: number, cartItems: any[]): number {
        let applicableAmount = 0;

        if (discount.scope === DiscountScope.GLOBAL) {
            applicableAmount = subtotal;
        } else if (discount.scope === DiscountScope.PRODUCT) {
            applicableAmount = cartItems
                .filter(item => item.productId === discount.productId)
                .reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
        } else if (discount.scope === DiscountScope.CATEGORY) {
            applicableAmount = cartItems
                .filter(item => item.product.categoryId === discount.categoryId)
                .reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
        }

        if (discount.type === DiscountType.PERCENTAGE) {
            return (applicableAmount * Number(discount.value)) / 100;
        } else {
            return Math.min(Number(discount.value), applicableAmount);
        }
    }

    async createDiscount(data: CreateDiscountDto): Promise<Discount> {
        return this.discountRepository.create(data);
    }

    async getAllDiscounts(): Promise<Discount[]> {
        return this.discountRepository.getAll();
    }

    async findDiscountById(id: string): Promise<Discount | null> {
        return this.discountRepository.findById(id);
    }

    async updateDiscount(id: string, data: Partial<CreateDiscountDto>): Promise<Discount> {
        const discount = await this.discountRepository.findById(id);
        if (!discount) {
            throw new Error('Discount not found');
        }

        if (data.code && data.code.toUpperCase() !== discount.code) {
            const existing = await this.discountRepository.findByCode(data.code);
            if (existing) {
                throw new Error('Discount with this code already exists');
            }
        }

        return this.discountRepository.update(id, data);
    }

    async deleteDiscount(id: string): Promise<void> {
        const discount = await this.discountRepository.findById(id);
        if (!discount) throw new AppError('Discount not found', 404);
        await this.discountRepository.softDelete(id);
    }
}
