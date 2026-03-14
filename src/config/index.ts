import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().url(),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    ACCESS_TOKEN_SECRET: z.string().min(32, 'Access token secret must be at least 32 characters'),
    REFRESH_TOKEN_SECRET: z.string().min(32, 'Refresh token secret must be at least 32 characters'),
    GCP_PROJECT_ID: z.string().optional(),
    GCP_BUCKET_NAME: z.string().optional(),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables:', _env.error.format());
    process.exit(1);
}

export const configs = _env.data;
export type Configs = z.infer<typeof envSchema>;
