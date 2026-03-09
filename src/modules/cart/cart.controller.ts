import { Request, Response } from 'express';
import { CartService } from './cart.service';
import { AddToCartSchema, UpdateCartItemSchema } from './cart.dto';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';

export class CartController {
    constructor(private readonly cartService: CartService) { }

    getCart = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const cart = await this.cartService.getOrCreateCart(userId);
        const summary = this.cartService.calculateCartTotal(cart);

        res.status(200).json({
            status: 'success',
            data: {
                ...cart,
                summary
            }
        });
    });

    addToCart = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const validatedData = AddToCartSchema.parse(req.body);
        const cart = await this.cartService.addToCart(userId, validatedData);
        const summary = this.cartService.calculateCartTotal(cart);

        res.status(200).json({
            status: 'success',
            data: {
                ...cart,
                summary
            }
        });
    });

    updateQuantity = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const productId = req.params.productId as string;
        const validatedData = UpdateCartItemSchema.parse(req.body);

        const cart = await this.cartService.updateItemQuantity(userId, productId, validatedData);
        const summary = this.cartService.calculateCartTotal(cart);

        res.status(200).json({
            status: 'success',
            data: {
                ...cart,
                summary
            }
        });
    });

    removeItem = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const productId = req.params.productId as string;
        const cart = await this.cartService.removeItem(userId, productId);
        const summary = this.cartService.calculateCartTotal(cart);

        res.status(200).json({
            status: 'success',
            data: {
                ...cart,
                summary
            }
        });
    });

    clearCart = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        await this.cartService.clearCart(userId);
        res.status(200).json({
            status: 'success',
            message: 'Cart cleared successfully'
        });
    });
}
