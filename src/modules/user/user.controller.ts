import { Request, Response } from 'express';
import { UserService } from './user.service';
import { RegisterSchema, LoginSchema } from './user.dto';
import { PaginationQuerySchema } from '../../common/dto/pagination.dto';
import { asyncHandler } from '../../common/middleware/async-handler';

export class UserController {
    constructor(private readonly userService: UserService) { }

    register = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = RegisterSchema.parse(req.body);
        const user = await this.userService.register(validatedData);

        res.status(201).json({
            message: 'User registered successfully',
            data: user,
        });
    });

    login = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = LoginSchema.parse(req.body);
        const user = await this.userService.login(validatedData);

        res.status(200).json({
            message: 'Login successful',
            data: user,
        });
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        const { page, limit } = PaginationQuerySchema.parse(req.query);
        const result = await this.userService.getAllUsers({ page, limit });
        res.status(200).json(result);
    });
}
