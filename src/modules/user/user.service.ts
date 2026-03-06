import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { RegisterInput, LoginInput } from './user.dto';
import { PaginatedResponse, getPaginationMeta } from '../../common/utils/pagination';
import { JwtUtil, REFRESH_TOKEN_REDIS_TTL } from '../../common/utils/jwt.util';
import redis from '../../config/redis';
import { AppError } from '../../common/errors/app-error';

export interface AuthResponse {
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
}

export class UserService {
    constructor(private readonly userRepository: UserRepository) { }

    /**
     * Đăng ký người dùng mới
     */
    async register(data: RegisterInput): Promise<Omit<User, 'password'>> {
        const { email, password, name } = data;

        // 1. Kiểm tra xem email đã tồn tại chưa
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new AppError('Email already exists', 400);
        }

        // 2. Hash mật khẩu (Senior rule: Salt rounds = 10 là chuẩn)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Lưu vào DB (role mặc định là USER đã được định nghĩa trong schema)
        const user = await this.userRepository.create({
            email,
            password: hashedPassword,
            name,
        });

        // 4. Trả về user nhưng loại bỏ mật khẩu
        return this.excludePassword(user);
    }

    /**
     * Đăng nhập
     */
    async login(data: LoginInput): Promise<AuthResponse> {
        const { email, password } = data;

        // 1. Tìm user
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        // 2. So khớp mật khẩu
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            throw new AppError('Invalid email or password', 401);
        }

        const payload = { userId: user.id, role: user.role };
        const accessToken = JwtUtil.generateAccessToken(payload);
        const refreshToken = JwtUtil.generateRefreshToken(payload);

        // Store refresh token in Redis
        await redis.set(
            `refresh_token:${user.id}`,
            refreshToken,
            'EX',
            REFRESH_TOKEN_REDIS_TTL
        );

        return {
            user: this.excludePassword(user),
            accessToken,
            refreshToken
        };
    }

    async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            const decoded = JwtUtil.verifyRefreshToken(token);

            // Check if token exists in Redis
            const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
            if (!storedToken || storedToken !== token) {
                throw new AppError('Invalid or expired refresh token', 401);
            }

            // Generate new pair (Security: Rotation)
            const payload = { userId: decoded.userId, role: decoded.role };
            const newAccessToken = JwtUtil.generateAccessToken(payload);
            const newRefreshToken = JwtUtil.generateRefreshToken(payload);

            // Update Redis
            await redis.set(
                `refresh_token:${decoded.userId}`,
                newRefreshToken,
                'EX',
                REFRESH_TOKEN_REDIS_TTL
            );

            return { accessToken: newAccessToken, refreshToken: newRefreshToken };
        } catch (error) {
            throw new AppError('Invalid or expired refresh token', 401);
        }
    }

    async logout(userId: string, accessToken: string): Promise<void> {
        // 1. Remove refresh token from Redis
        await redis.del(`refresh_token:${userId}`);

        // 2. Blacklist current access token (until it expires)
        // We can extract expiration from token or just set a reasonable default like 15m
        await redis.set(`blacklist:${accessToken}`, 'true', 'EX', 15 * 60);
    }

    private excludePassword(user: User): Omit<User, 'password'> {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
        const user = await this.userRepository.findById(id);
        return user ? this.excludePassword(user) : null;
    }

    async getAllUsers(params: { page: number; limit: number }): Promise<PaginatedResponse<Omit<User, 'password'>>> {
        const { page, limit } = params;
        const skip = (page - 1) * limit;

        const { data, total } = await this.userRepository.findAll({
            skip,
            take: limit
        });

        return {
            data: data.map((user) => this.excludePassword(user)),
            meta: getPaginationMeta(total, page, limit)
        };
    }
}
