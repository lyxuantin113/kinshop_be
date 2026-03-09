import { Cart, CartItem, Product } from '@prisma/client';
import prisma from '../../config/database';

export type CartWithItems = Cart & {
    items: (CartItem & { product: Product })[];
};

export class CartRepository {
    async getByUserId(userId: string): Promise<CartWithItems | null> {
        return prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        }) as any;
    }

    async createCart(userId: string): Promise<Cart> {
        return prisma.cart.create({
            data: { userId },
        });
    }

    async findCartItem(cartId: string, productId: string): Promise<CartItem | null> {
        return prisma.cartItem.findFirst({
            where: { cartId, productId },
        });
    }

    async addItem(cartId: string, productId: string, quantity: number): Promise<CartItem> {
        return prisma.cartItem.create({
            data: { cartId, productId, quantity },
        });
    }

    async updateItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
        return prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity },
        });
    }

    async removeItem(itemId: string): Promise<CartItem> {
        return prisma.cartItem.delete({
            where: { id: itemId },
        });
    }

    async clearCart(cartId: string): Promise<void> {
        await prisma.cartItem.deleteMany({
            where: { cartId },
        });
    }
}
