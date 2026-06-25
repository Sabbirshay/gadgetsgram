import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryTransaction, Product])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService], // Exported to be used by OrdersService
})
export class InventoryModule {}
