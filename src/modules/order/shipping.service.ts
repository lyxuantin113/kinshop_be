import { SystemConfigService, ConfigKey } from '../system-config/system-config.service';

export class ShippingService {
    constructor(private readonly systemConfigService: SystemConfigService) { }

    async calculateShippingFee(subtotal: number): Promise<number> {
        const freeThresholdStr = await this.systemConfigService.getConfig(ConfigKey.SHIPPING_FREE_THRESHOLD);
        const baseFeeStr = await this.systemConfigService.getConfig(ConfigKey.SHIPPING_BASE_FEE);

        const freeThreshold = Number(freeThresholdStr);
        const baseFee = Number(baseFeeStr);

        if (subtotal >= freeThreshold) {
            return 0;
        }
        return baseFee;
    }
}
