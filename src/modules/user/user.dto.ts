import { z } from 'zod';

/**
 * Schema cho việc đăng ký người dùng mới
 */
export const RegisterSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    passwordConfirm: z.string().min(6, 'Password confirmation must be at least 6 characters'),
    name: z.string().optional(),
}).refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ["passwordConfirm"],
});

/**
 * Schema cho việc đăng nhập
 */
export const LoginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
