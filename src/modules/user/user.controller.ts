import { Request, Response } from 'express';
import { UserService } from './user.service';
import { RegisterSchema, LoginSchema } from './user.dto';
import { PaginationQuerySchema } from '../../common/dto/pagination.dto';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';
import { ApiResponse } from '../../common/utils/api-response';

export class UserController {
    constructor(private readonly userService: UserService) { }

    register = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = RegisterSchema.parse(req.body);
        const user = await this.userService.register(validatedData);

        return ApiResponse.success(res, user, 201);
    });

    login = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = LoginSchema.parse(req.body);
        const { user, accessToken, refreshToken } = await this.userService.login(validatedData);

        const cookieOptions: any = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        };

        res.cookie('refreshToken', refreshToken, cookieOptions);

        return ApiResponse.success(res, {
            user,
            accessToken
        });
    });

    logout = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        const accessToken = req.headers.authorization?.split(' ')[1];

        if (userId && accessToken) {
            await this.userService.logout(userId, accessToken);
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' as any
        });
        
        return ApiResponse.success(res, { message: 'Logged out successfully' });
    });

    refresh = asyncHandler(async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw new AppError('Refresh token missing', 401);
        }

        const tokens = await this.userService.refreshToken(refreshToken);

        const cookieOptions: any = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        };

        res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

        return ApiResponse.success(res, {
            accessToken: tokens.accessToken
        });
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        const { page, limit } = PaginationQuerySchema.parse(req.query);
        const result = await this.userService.getAllUsers({ page, limit });
        return ApiResponse.paginated(res, result.data, result.meta);
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await this.userService.deleteUser(id);
        return ApiResponse.success(res, null);
    });
}
