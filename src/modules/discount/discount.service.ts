import { Discount, DiscountType, DiscountScope, CartItem } from '@prisma/client';
import { DiscountRepository } from './discount.repository';
import { AppError } from '../../common/errors/app-error';

export class DiscountService {
    constructor(private readonly discountRepository: DiscountRepository) { }

    /**
     * Senior Level: Complex validation for coupons including scope checks
     */
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

        // Scope Validation
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

    /**
     * Calculate final discount amount based on type and scope
     */
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
            // Fixed amount - limited by the applicable product price to avoid negative
            return Math.min(Number(discount.value), applicableAmount);
        }
    }
}
