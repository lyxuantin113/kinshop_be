import { Prisma, User } from '@prisma/client';
import prisma from '../../config/database';

export class UserRepository {
    /**
     * Tìm người dùng theo Email
     * Đầy là một thao tác đọc (Read) cơ bản từ DB.
     */
    async findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    /**
     * Tạo người dùng mới
     * Nhận vào dữ liệu (DTO) và trả về User đã tạo.
     */
    async create(data: Prisma.UserCreateInput): Promise<User> {
        return prisma.user.create({
            data,
        });
    }

    /**
     * Tìm người dùng theo ID
     */
    async findById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id },
        });
    }

    /**
     * Lấy danh sách tất cả người dùng
     */
    async findAll(): Promise<User[]> {
        return prisma.user.findMany();
    }
}
