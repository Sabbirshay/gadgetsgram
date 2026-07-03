import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

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
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CourierModule } from './courier/courier.module';
import { InventoryModule } from './inventory/inventory.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): any => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            ssl: { rejectUnauthorized: false }, // Render requires SSL
            entities: [
              User, Product, Order, OrderStatusHistory, Customer, Notification, CourierShipment, AuditLog, Setting, InventoryTransaction,
            ],
            synchronize: true, // Typically false in prod, but keeping true for automatic schema sync on this project
          };
        }
        
        // Fallback to SQLite for local development
        return {
          type: 'better-sqlite3',
          database: configService.get<string>('DB_DATABASE', './data/gadgets-gram.db'),
          entities: [
            User, Product, Order, OrderStatusHistory, Customer, Notification, CourierShipment, AuditLog, Setting, InventoryTransaction,
          ],
          synchronize: true,
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [{
        ttl: configService.get<number>('THROTTLE_TTL', 60000),
        limit: configService.get<number>('THROTTLE_LIMIT', 100),
      }],
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    AuthModule,
    OrdersModule,
    ProductsModule,
    CustomersModule,
    AnalyticsModule,
    NotificationsModule,
    CourierModule,
    InventoryModule,
    CloudinaryModule,
    SupabaseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
