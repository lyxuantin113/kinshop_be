import { SystemConfig } from '@prisma/client';
import prisma from '../../config/database';

export class SystemConfigRepository {
    async getByKey(key: string): Promise<SystemConfig | null> {
        return prisma.systemConfig.findUnique({
            where: { key },
        });
    }

    async upsert(key: string, value: string, description?: string): Promise<SystemConfig> {
        return prisma.systemConfig.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description },
        });
    }

    async getAll(): Promise<SystemConfig[]> {
        return prisma.systemConfig.findMany();
    }
}
