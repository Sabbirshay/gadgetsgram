import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './auth/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { Order } from './orders/entities/order.entity';
import { OrderStatusHistory } from './orders/entities/order-status-history.entity';
import { Customer } from './customers/entities/customer.entity';
import { Notification } from './notifications/entities/notification.entity';
import { CourierShipment } from './courier/entities/courier-shipment.entity';
import { AuditLog } from './common/entities/audit-log.entity';
import { Setting } from './common/entities/setting.entity';
import { InventoryTransaction } from './inventory/entities/inventory-transaction.entity';

dotenv.config();

const isProduction = !!process.env.DATABASE_URL;

const config: DataSourceOptions = isProduction
  ? {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      entities: [
        User, Product, Order, OrderStatusHistory, Customer, Notification, CourierShipment, AuditLog, Setting, InventoryTransaction,
      ],
      migrations: ['src/migrations/*{.ts,.js}'],
      synchronize: false,
    }
  : {
      type: 'better-sqlite3',
      database: process.env.DB_DATABASE || './data/gadgets-gram.db',
      entities: [
        User, Product, Order, OrderStatusHistory, Customer, Notification, CourierShipment, AuditLog, Setting, InventoryTransaction,
      ],
      migrations: ['src/migrations/*{.ts,.js}'],
      synchronize: false, // Disabling sync for local dev as well to use strict migrations
    };

export const AppDataSource = new DataSource(config);
