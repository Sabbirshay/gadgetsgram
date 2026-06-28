import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { Customer } from '../customers/entities/customer.entity';
import { OrderStatus } from '../common/enums';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderStatusHistory)
    private readonly statusHistoryRepository: Repository<OrderStatusHistory>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly productsService: ProductsService,
    private readonly inventoryService: InventoryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const product = await this.productsService.findOne(createOrderDto.product_id);
    
    if (product.stock < (createOrderDto.quantity || 1)) {
      throw new BadRequestException('Not enough stock available');
    }

    const price = Number(product.sale_price || product.price);
    const quantity = createOrderDto.quantity || 1;
    const delivery_charge = 60; // Base delivery charge, can be dynamic based on district later
    const subtotal = (price * quantity) + delivery_charge;

    // Customer Handling
    let customer = await this.customerRepository.findOne({ where: { phone: createOrderDto.phone } });
    if (!customer) {
      customer = this.customerRepository.create({
        name: createOrderDto.customer_name,
        phone: createOrderDto.phone,
        orders_count: 0,
        lifetime_value: 0,
      });
      await this.customerRepository.save(customer);
    }
    
    // Update Customer Stats
    customer.orders_count += 1;
    customer.lifetime_value = Number(customer.lifetime_value) + subtotal;
    customer.last_order_date = new Date();
    await this.customerRepository.save(customer);

    const order = this.orderRepository.create({
      ...createOrderDto,
      quantity,
      price,
      delivery_charge,
      subtotal,
      status: OrderStatus.PENDING,
      customer_id: customer.id,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Record initial status history: null → pending
    await this.statusHistoryRepository.save(
      this.statusHistoryRepository.create({
        order_id: savedOrder.id,
        from_status: null,
        to_status: OrderStatus.PENDING,
      }),
    );

    // Reserve stock
    await this.inventoryService.reserveStock(product.id, quantity, savedOrder.id.toString());

    // Emit event for notification service
    this.eventEmitter.emit('order.created', savedOrder);

    return savedOrder;
  }

  async findAll(status?: string, search?: string, dateRange?: string) {
    const query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.statusHistory', 'statusHistory')
      .leftJoinAndSelect('order.product', 'product');

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(order.phone LIKE :search OR order.customer_name LIKE :search OR CAST(order.id AS TEXT) = :exactSearch)',
        { search: `%${search}%`, exactSearch: search }
      );
    }

    if (dateRange) {
      const today = new Date();
      if (dateRange === 'today') {
        const start = new Date(today.setHours(0,0,0,0));
        query.andWhere('order.created_at >= :start', { start });
      } else if (dateRange === 'yesterday') {
        const start = new Date(today.setDate(today.getDate() - 1));
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setHours(23,59,59,999);
        query.andWhere('order.created_at BETWEEN :start AND :end', { start, end });
      } else if (dateRange === 'this_week') {
        const start = new Date(today.setDate(today.getDate() - today.getDay()));
        start.setHours(0,0,0,0);
        query.andWhere('order.created_at >= :start', { start });
      }
    }

    query.addOrderBy('statusHistory.changed_at', 'ASC');
    query.orderBy('order.created_at', 'DESC');
    return query.getMany();
  }

  async findOne(id: number) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { statusHistory: true, product: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    // Sort status history by changed_at ascending
    if (order.statusHistory) {
      order.statusHistory.sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());
    }
    return order;
  }

  async updateStatus(id: number, status: OrderStatus) {
    const order = await this.findOne(id);
    const oldStatus = order.status;
    order.status = status;
    const updatedOrder = await this.orderRepository.save(order);

    // Record status change history
    await this.statusHistoryRepository.save(
      this.statusHistoryRepository.create({
        order_id: id,
        from_status: oldStatus,
        to_status: status,
      }),
    );
    
    // Release stock if cancelled or returned (and it wasn't already cancelled/returned)
    if (
      (status === OrderStatus.CANCELLED || status === OrderStatus.RETURNED) &&
      !(oldStatus === OrderStatus.CANCELLED || oldStatus === OrderStatus.RETURNED)
    ) {
      await this.inventoryService.releaseStock(order.product_id, order.quantity, order.id.toString());
    }

    this.eventEmitter.emit('order.status_updated', updatedOrder);

    // Re-fetch to include latest status history
    return this.findOne(id);
  }
}
