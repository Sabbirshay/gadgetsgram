import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  @OnEvent('order.created')
  async handleOrderCreatedEvent(order: any) {
    this.logger.log(`Handling order.created event for Order ID: ${order.id}`);

    // Create a notification record (mocking queue behavior)
    const notification = this.notificationRepository.create({
      order_id: order.id,
      channel: 'sms',
      type: 'order_received',
      status: 'sent', // Mock immediate send
      payload: JSON.stringify({
        message: `Dear ${order.customer_name}, your order for BDT ${order.subtotal} has been received.`,
        phone: order.phone,
      }),
      sent_at: new Date(),
    });

    await this.notificationRepository.save(notification);
    this.logger.log(`Mock SMS sent to ${order.phone}`);
  }

  @OnEvent('order.status_updated')
  async handleOrderStatusUpdatedEvent(order: any) {
    this.logger.log(`Handling order.status_updated event for Order ID: ${order.id}`);

    const notification = this.notificationRepository.create({
      order_id: order.id,
      channel: 'sms',
      type: `order_${order.status}`,
      status: 'sent',
      payload: JSON.stringify({
        message: `Your order status is now: ${order.status}`,
        phone: order.phone,
      }),
      sent_at: new Date(),
    });

    await this.notificationRepository.save(notification);
  }
}
