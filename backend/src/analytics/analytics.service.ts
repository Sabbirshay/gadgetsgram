import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../common/enums';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async getDashboardKpis() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Promises for parallel execution
    const [
      todaysOrders,
      pendingOrders,
      confirmedOrders,
      courierBookedOrders,
      deliveredOrders,
      returnedOrders,
      monthlyOrders
    ] = await Promise.all([
      this.orderRepository.find({ where: { created_at: Between(today, endOfToday) } }),
      this.orderRepository.count({ where: { status: OrderStatus.PENDING } }),
      this.orderRepository.count({ where: { status: OrderStatus.CONFIRMED } }),
      this.orderRepository.count({ where: { status: OrderStatus.PACKED } }), // Using PACKED for Courier Booked for now
      this.orderRepository.count({ where: { status: OrderStatus.DELIVERED } }),
      this.orderRepository.count({ where: { status: OrderStatus.RETURNED } }),
      this.orderRepository.find({ where: { created_at: Between(firstDayOfMonth, endOfToday) } }),
    ]);

    const todaysRevenue = todaysOrders.reduce((sum, order) => sum + Number(order.subtotal), 0);
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + Number(order.subtotal), 0);

    return {
      todaysOrders: todaysOrders.length,
      pendingOrders,
      confirmedOrders,
      courierBookedOrders,
      deliveredOrders,
      returnedOrders,
      todaysRevenue,
      monthlyRevenue,
    };
  }
}
