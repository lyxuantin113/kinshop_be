import eventEmitter from '../../common/events/event-emitter';
import logger from '../../common/utils/logger';

export const setupOrderListeners = () => {
    // Lắng nghe sự kiện khi đơn hàng được tạo thành công
    eventEmitter.on('order.created', (order) => {
        logger.info({ orderId: order.id }, 'Event: order.created - Ready to send email/notification');
        
        // Giả sử sau này bạn muốn:
        // 1. Gửi email xác nhận: EmailService.sendOrderConfirmation(order);
        // 2. Thông báo cho Admin qua Slack: SlackService.notifyNewOrder(order);
        // 3. Cập nhật hệ thống kho bãi ngoài (3PL): ThirdPartyLogistics.sync(order);
    });

    // Lắng nghe sự kiện khi trạng thái đơn hàng thay đổi
    eventEmitter.on('order.status_updated', ({ orderId, status }) => {
        logger.info({ orderId, status }, `Event: order.status_updated - Notifying user about status change to ${status}`);
    });
};
