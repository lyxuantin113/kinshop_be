import { Request, Response } from 'express';
import { DiscountService } from './discount.service';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';
import { CreateDiscountSchema } from './discount.dto';
import { ApiResponse } from '../../common/utils/api-response';

export class DiscountController {
    constructor(private readonly discountService: DiscountService) { }

    createDiscount = asyncHandler(async (req: Request, res: Response) => {
        const data = CreateDiscountSchema.parse(req.body);
        const discount = await this.discountService.createDiscount(data);
        return ApiResponse.success(res, discount, 201);
    });

    getAllDiscounts = asyncHandler(async (req: Request, res: Response) => {
        const discounts = await this.discountService.getAllDiscounts();
        return ApiResponse.success(res, discounts);
    });

    updateDiscount = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const data = CreateDiscountSchema.partial().parse(req.body);
        const discount = await this.discountService.updateDiscount(id, data);
        return ApiResponse.success(res, discount);
    });

    deleteDiscount = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await this.discountService.deleteDiscount(id);
        return ApiResponse.noContent(res);
    });
}
