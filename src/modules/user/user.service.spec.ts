import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { User, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

describe('UserService', () => {
    let userService: UserService;
    let userRepositoryMock: DeepMockProxy<UserRepository>;

    beforeEach(() => {
        userRepositoryMock = mockDeep<UserRepository>();
        userService = new UserService(userRepositoryMock);
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
                password: 'hashed_password', // Giả sử trong DB là mật khẩu đã hash
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
        it('should return user without password on successful login', async () => {
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

            expect((result as any).password).toBeUndefined();
            expect(result.id).toBe('uuid-123');
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
});
