import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
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
  private readonly logger = new Logger(OrdersService.name);

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
    private readonly supabaseService: SupabaseService,
  ) {}

  async create(createOrderDto: CreateOrderDto, authHeader?: string) {
    let customer;

    // Check if customer is authenticated
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data.user) {
          customer = await this.customerRepository.findOne({ where: { uid: data.user.id } });
        }
      } catch (err) {
        this.logger.error(`Failed to verify token during order creation: ${err.message}`);
      }
    }

    // If not authenticated or not found in DB, find or create by phone
    if (!customer) {
      customer = await this.customerRepository.findOne({ where: { phone: createOrderDto.phone } });
      if (!customer) {
        customer = this.customerRepository.create({
          name: createOrderDto.customerName,
          phone: createOrderDto.phone,
          orders_count: 0,
          lifetime_value: 0,
        });
        await this.customerRepository.save(customer);
      }
    }

    // Proactively update customer phone and address if they were empty
    let customerUpdated = false;
    if (!customer.phone && createOrderDto.phone) {
      customer.phone = createOrderDto.phone;
      customerUpdated = true;
    }
    if (!customer.address && createOrderDto.address) {
      customer.address = createOrderDto.address;
      customerUpdated = true;
    }
    if (customerUpdated) {
      await this.customerRepository.save(customer);
    }

    // Resolve product items and verify stock
    const rawItems = createOrderDto.items;
    const orderItems: any[] = [];
    let firstProductId = createOrderDto.productId;
    let firstQty = createOrderDto.quantity || 1;
    let firstPrice = 0;

    if (rawItems && Array.isArray(rawItems) && rawItems.length > 0) {
      for (const item of rawItems) {
        const product = await this.productsService.findOne(item.productId);
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Not enough stock available for ${product.title}`);
        }
        const price = Number(product.sale_price || product.price);
        orderItems.push({
          productId: product.id,
          title: product.title,
          price,
          quantity: item.quantity,
          image: JSON.parse(product.images || '[]')[0] || 'assets/headphone.png'
        });
      }
      firstProductId = orderItems[0].productId;
      firstQty = orderItems[0].quantity;
      firstPrice = orderItems[0].price;
    } else {
      const product = await this.productsService.findOne(createOrderDto.productId);
      if (product.stock < firstQty) {
        throw new BadRequestException('Not enough stock available');
      }
      firstPrice = Number(product.sale_price || product.price);
      orderItems.push({
        productId: product.id,
        title: product.title,
        price: firstPrice,
        quantity: firstQty,
        image: JSON.parse(product.images || '[]')[0] || 'assets/headphone.png'
      });
    }

    const delivery_charge = 60; // Flat delivery charge for consolidated order
    const itemsTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const subtotal = itemsTotal + delivery_charge;

    // Update Customer Stats
    customer.orders_count += 1;
    customer.lifetime_value = Number(customer.lifetime_value) + subtotal;
    customer.last_order_date = new Date();
    await this.customerRepository.save(customer);

    const order = this.orderRepository.create({
      customer_name: createOrderDto.customerName,
      phone: createOrderDto.phone,
      alternative_phone: createOrderDto.alternativePhone,
      address: createOrderDto.address,
      district: createOrderDto.district,
      product_id: firstProductId,
      notes: createOrderDto.note,
      quantity: firstQty,
      price: firstPrice,
      delivery_charge,
      subtotal,
      status: OrderStatus.PENDING,
      customer_id: customer.id,
      items_json: JSON.stringify(orderItems)
    });

    let savedOrder = await this.orderRepository.save(order);
    savedOrder.orderId = `GG-${1000 + savedOrder.id}`;
    savedOrder = await this.orderRepository.save(savedOrder);

    // Record initial status history: null → pending
    await this.statusHistoryRepository.save(
      this.statusHistoryRepository.create({
        order_id: savedOrder.id,
        from_status: null,
        to_status: OrderStatus.PENDING,
      }),
    );

    // Reserve stock for all items
    for (const item of orderItems) {
      await this.inventoryService.reserveStock(item.productId, item.quantity, savedOrder.id.toString());
    }

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

  async findByOrderId(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { orderId },
      relations: { statusHistory: true, product: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    
    // Sort status history
    if (order.statusHistory) {
      order.statusHistory.sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());
    }
    
    // For tracking, we don't need to return full customer PII, but we return safe fields
    return {
      orderId: order.orderId,
      status: order.status,
      created_at: order.created_at,
      product: order.product ? { title: order.product.title } : null,
      quantity: order.quantity,
      subtotal: order.subtotal,
      statusHistory: order.statusHistory,
    };
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
      if (order.items_json) {
        try {
          const items = JSON.parse(order.items_json);
          for (const item of items) {
            await this.inventoryService.releaseStock(item.productId, item.quantity, order.id.toString());
          }
        } catch (err) {
          this.logger.error(`Failed to release stock for items_json: ${err.message}`);
        }
      } else {
        await this.inventoryService.releaseStock(order.product_id, order.quantity, order.id.toString());
      }
    }

    this.eventEmitter.emit('order.status_updated', updatedOrder);

    // Re-fetch to include latest status history
    return this.findOne(id);
  }
}
