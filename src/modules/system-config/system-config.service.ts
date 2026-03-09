import { SystemConfigRepository } from './system-config.repository';
import { AppError } from '../../common/errors/app-error';

export enum ConfigKey {
    SHIPPING_BASE_FEE = 'SHIPPING_BASE_FEE',
    SHIPPING_FREE_THRESHOLD = 'SHIPPING_FREE_THRESHOLD',
}

export class SystemConfigService {
    constructor(private readonly repository: SystemConfigRepository) { }

    async getConfig(key: ConfigKey): Promise<string> {
        const config = await this.repository.getByKey(key);
        if (!config) {
            // Fallback to env or default values if not in DB yet
            const defaultValue = this.getDefaultValue(key);
            if (defaultValue === undefined) {
                throw new AppError(`Config key ${key} not found`, 404);
            }
            return defaultValue;
        }
        return config.value;
    }

    async setConfig(key: ConfigKey, value: string, description?: string): Promise<void> {
        await this.repository.upsert(key, value, description);
    }

    async getAllConfigs() {
        return this.repository.getAll();
    }

    private getDefaultValue(key: ConfigKey): string | undefined {
        switch (key) {
            case ConfigKey.SHIPPING_BASE_FEE:
                return process.env.SHIPPING_BASE_FEE || '5.00';
            case ConfigKey.SHIPPING_FREE_THRESHOLD:
                return process.env.SHIPPING_FREE_THRESHOLD || '100.00';
            default:
                return undefined;
        }
    }
}
