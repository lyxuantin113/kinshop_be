import { Request, Response } from 'express';
import { UserService } from './user.service';
import { RegisterSchema, LoginSchema } from './user.dto';

export class UserController {
    constructor(private readonly userService: UserService) { }

    /**
     * Đăng ký
     */
    register = async (req: Request, res: Response) => {
        try {
            // 1. Validate dữ liệu đầu vào bằng Zod
            const validatedData = RegisterSchema.parse(req.body);

            // 2. Chuyển cho Service xử lý
            const user = await this.userService.register(validatedData);

            res.status(201).json({
                message: 'User registered successfully',
                data: user,
            });
        } catch (error: any) {
            // Nếu là lỗi validation của Zod, trả về chi tiết lỗi
            if (error.name === 'ZodError') {
                return res.status(400).json({
                    message: 'Validation Error',
                    errors: error.errors,
                });
            }

            res.status(400).json({
                message: error.message || 'Error registering user',
            });
        }
    };

    /**
     * Đăng nhập
     */
    login = async (req: Request, res: Response) => {
        try {
            // 1. Validate
            const validatedData = LoginSchema.parse(req.body);

            // 2. Xử lý đăng nhập
            const user = await this.userService.login(validatedData);

            res.status(200).json({
                message: 'Login successful',
                data: user,
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({
                    message: 'Validation Error',
                    errors: error.errors,
                });
            }

            res.status(401).json({
                message: error.message || 'Unauthorized',
            });
        }
    };

    /**
     * Lấy danh sách người dùng
     */
    getAll = async (req: Request, res: Response) => {
        try {
            const users = await this.userService.getAllUsers();
            res.status(200).json({
                data: users,
            });
        } catch (error: any) {
            res.status(500).json({
                message: 'Error fetching users',
            });
        }
    };
}
