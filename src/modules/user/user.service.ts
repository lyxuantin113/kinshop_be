import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { RegisterInput, LoginInput } from './user.dto';

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
            throw new Error('Email already exists');
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
    async login(data: LoginInput): Promise<Omit<User, 'password'>> {
        const { email, password } = data;

        // 1. Tìm user
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // 2. So khớp mật khẩu
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            throw new Error('Invalid email or password');
        }

        // 3. Trả về user (Không bao gồm password)
        return this.excludePassword(user);
    }

    /**
     * Helper: Loại bỏ password khỏi Object User
     */
    private excludePassword(user: User): Omit<User, 'password'> {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
        const user = await this.userRepository.findById(id);
        return user ? this.excludePassword(user) : null;
    }

    async getAllUsers(): Promise<Omit<User, 'password'>[]> {
        const users = await this.userRepository.findAll();
        return users.map((user) => this.excludePassword(user));
    }
}
