import { Request, Response } from 'express';
import { DiscountService } from './discount.service';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';
import { CreateDiscountSchema } from './discount.dto';

export class DiscountController {
    constructor(private readonly discountService: DiscountService) { }

    createDiscount = asyncHandler(async (req: Request, res: Response) => {
        const data = CreateDiscountSchema.parse(req.body);
        const discount = await this.discountService.createDiscount(data);
        res.status(201).json({
            status: 'success',
            data: discount
        });
    });

    getAllDiscounts = asyncHandler(async (req: Request, res: Response) => {
        const discounts = await this.discountService.getAllDiscounts();
        res.status(200).json({
            status: 'success',
            data: discounts
        });
    });

    updateDiscount = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const data = CreateDiscountSchema.partial().parse(req.body);
        const discount = await this.discountService.updateDiscount(id, data);
        res.status(200).json({
            status: 'success',
            data: discount
        });
    });

    deleteDiscount = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await this.discountService.deleteDiscount(id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    });
}
