import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { User, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import redis from '../../config/redis';

// Mock Redis
jest.mock('../../config/redis', () => ({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn()
}));

describe('UserService', () => {
    let userService: UserService;
    let userRepositoryMock: DeepMockProxy<UserRepository>;

    beforeEach(() => {
        userRepositoryMock = mockDeep<UserRepository>();
        userService = new UserService(userRepositoryMock);
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user successfully with hashed password', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                passwordConfirm: 'password123',
                name: 'Test User'
            };

            const createdUser: User = {
                id: 'uuid-123',
                email: 'test@example.com',
                password: 'hashed_password',
                name: 'Test User',
                role: Role.USER,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            userRepositoryMock.findByEmail.mockResolvedValue(null);
            userRepositoryMock.create.mockResolvedValue(createdUser);

            const result = await userService.register(userData as any);

            // Verify password bị loại bỏ khỏi kết quả trả về
            expect((result as any).password).toBeUndefined();
            expect(result.email).toBe('test@example.com');

            expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith('test@example.com');
            // Verify mật khẩu được lưu vào DB phải khác mật khẩu plain text (vì đã hash)
            const createCall = userRepositoryMock.create.mock.calls[0][0];
            expect(createCall.password).not.toBe('password123');
        });

        it('should throw an error if email already exists', async () => {
            const userData = {
                email: 'existing@example.com',
                password: 'password123',
                passwordConfirm: 'password123',
                name: 'Existing User'
            };

            userRepositoryMock.findByEmail.mockResolvedValue({} as User);

            await expect(userService.register(userData as any)).rejects.toThrow('Email already exists');
        });
    });

    describe('login', () => {
        it('should return user and tokens on successful login', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const hashedPassword = await bcrypt.hash('password123', 10);
            const userInDb: User = {
                id: 'uuid-123',
                email: 'test@example.com',
                password: hashedPassword,
                name: 'Test User',
                role: Role.USER,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            userRepositoryMock.findByEmail.mockResolvedValue(userInDb);

            const result = await userService.login(loginData);

            expect(result.user.id).toBe('uuid-123');
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(redis.set).toHaveBeenCalled();
        });

        it('should throw error for incorrect password', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            const hashedPassword = await bcrypt.hash('correctpassword', 10);
            userRepositoryMock.findByEmail.mockResolvedValue({
                password: hashedPassword
            } as User);

            await expect(userService.login(loginData)).rejects.toThrow('Invalid email or password');
        });
    });

    describe('refreshToken', () => {
        it('should generate new tokens if refresh token is valid', async () => {
            const oldToken = 'valid-refresh-token';
            // Mock verify
            const jwt = require('jsonwebtoken');
            jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 'uuid-123', role: Role.USER });

            (redis.get as jest.Mock).mockResolvedValue(oldToken);

            const result = await userService.refreshToken(oldToken);

            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(redis.set).toHaveBeenCalled();
        });
    });

    describe('getAllUsers', () => {
        it('should return paginated user list', async () => {
            const users: User[] = [
                { id: '1', email: 'u1@e.com', password: 'h1', name: 'U1', role: Role.USER, createdAt: new Date(), updatedAt: new Date() }
            ];

            userRepositoryMock.findAll.mockResolvedValue({ data: users, total: 1 });

            const result = await userService.getAllUsers({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.meta.totalItems).toBe(1);
            expect((result.data[0] as any).password).toBeUndefined();
        });
    });
});
