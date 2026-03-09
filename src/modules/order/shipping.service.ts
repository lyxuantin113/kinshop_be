export class ShippingService {
    private readonly BASE_SHIPPING_FEE = Number(process.env.SHIPPING_BASE_FEE) || 5.00;
    private readonly FREE_SHIPPING_THRESHOLD = Number(process.env.SHIPPING_FREE_THRESHOLD) || 100.00;

    /**
     * Senior Level: Business logic for shipping calculation
     * Now reading from environment variables for easy configuration
     */
    calculateShippingFee(subtotal: number): number {
        if (subtotal >= this.FREE_SHIPPING_THRESHOLD) {
            return 0;
        }
        return this.BASE_SHIPPING_FEE;
    }
}
