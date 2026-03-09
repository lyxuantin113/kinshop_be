import { CartRepository, CartWithItems } from './cart.repository';
import { AddToCartInput, UpdateCartItemInput } from './cart.dto';
import { AppError } from '../../common/errors/app-error';

export class CartService {
    constructor(private readonly cartRepository: CartRepository) { }

    async getOrCreateCart(userId: string): Promise<CartWithItems> {
        let cart = await this.cartRepository.getByUserId(userId);
        if (!cart) {
            await this.cartRepository.createCart(userId);
            cart = (await this.cartRepository.getByUserId(userId))!;
        }
        return cart;
    }

    async addToCart(userId: string, data: AddToCartInput): Promise<CartWithItems> {
        const { productId, quantity } = data;
        const cart = await this.getOrCreateCart(userId);

        const existingItem = await this.cartRepository.findCartItem(cart.id, productId);

        if (existingItem) {
            await this.cartRepository.updateItemQuantity(existingItem.id, existingItem.quantity + quantity);
        } else {
            await this.cartRepository.addItem(cart.id, productId, quantity);
        }

        return (await this.cartRepository.getByUserId(userId))!;
    }

    async updateItemQuantity(userId: string, productId: string, data: UpdateCartItemInput): Promise<CartWithItems> {
        const cart = await this.cartRepository.getByUserId(userId);
        if (!cart) throw new AppError('Cart not found', 404);

        const item = await this.cartRepository.findCartItem(cart.id, productId);
        if (!item) throw new AppError('Item not found in cart', 404);

        await this.cartRepository.updateItemQuantity(item.id, data.quantity);

        return (await this.cartRepository.getByUserId(userId))!;
    }

    async removeItem(userId: string, productId: string): Promise<CartWithItems> {
        const cart = await this.cartRepository.getByUserId(userId);
        if (!cart) throw new AppError('Cart not found', 404);

        const item = await this.cartRepository.findCartItem(cart.id, productId);
        if (!item) throw new AppError('Item not found in cart', 404);

        await this.cartRepository.removeItem(item.id);

        return (await this.cartRepository.getByUserId(userId))!;
    }

    async clearCart(userId: string): Promise<void> {
        const cart = await this.cartRepository.getByUserId(userId);
        if (cart) {
            await this.cartRepository.clearCart(cart.id);
        }
    }

    /**
     * Calculate total summary for the cart
     */
    calculateCartTotal(cart: CartWithItems): { totalItems: number, totalPrice: number } {
        const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
        const totalPrice = cart.items.reduce((acc, item) => {
            return acc + (Number(item.product.price) * item.quantity);
        }, 0);

        return { totalItems, totalPrice };
    }
}
