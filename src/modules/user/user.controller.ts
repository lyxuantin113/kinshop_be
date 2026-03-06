import { Request, Response } from 'express';
import { UserService } from './user.service';
import { RegisterSchema, LoginSchema } from './user.dto';
import { PaginationQuerySchema } from '../../common/dto/pagination.dto';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';

export class UserController {
    constructor(private readonly userService: UserService) { }

    register = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = RegisterSchema.parse(req.body);
        const user = await this.userService.register(validatedData);

        res.status(201).json({
            status: 'success',
            data: user,
        });
    });

    login = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = LoginSchema.parse(req.body);
        const { user, accessToken, refreshToken } = await this.userService.login(validatedData);

        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true in production
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            status: 'success',
            data: {
                user,
                accessToken
            },
        });
    });

    logout = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        const accessToken = req.headers.authorization?.split(' ')[1];

        if (userId && accessToken) {
            await this.userService.logout(userId, accessToken);
        }

        res.clearCookie('refreshToken');
        res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    });

    refresh = asyncHandler(async (req: Request, res: Response) => {

        // PENDING: TỐI ƯU LOGIC VÀO SERVICE
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw new AppError('Refresh token missing', 401);
        }

        const tokens = await this.userService.refreshToken(refreshToken);

        // Set new refresh token in cookie (Rotation)
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            status: 'success',
            data: {
                accessToken: tokens.accessToken
            }
        });
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        const { page, limit } = PaginationQuerySchema.parse(req.query);
        const result = await this.userService.getAllUsers({ page, limit });
        res.status(200).json(result);
    });
}
