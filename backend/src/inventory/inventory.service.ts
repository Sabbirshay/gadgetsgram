import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryTransactionType } from '../common/enums';
import csvParser = require('csv-parser');
import { Readable } from 'stream';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepository: Repository<InventoryTransaction>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getSummary() {
    const products = await this.productRepository.find();
    
    // In a real high-scale app, this would be an aggregation query in the database.
    // For this demonstration, we'll fetch transactions and aggregate in memory or use the DB.
    const summaries = await Promise.all(products.map(async (p) => {
      const transactions = await this.transactionRepository.find({ where: { product_id: p.id } });
      
      let available = p.stock;
      let reserved = 0;
      let sold = 0;
      let returned = 0;

      transactions.forEach(t => {
        if (t.type === InventoryTransactionType.RESERVED) reserved += t.quantity;
        if (t.type === InventoryTransactionType.OUT) sold += t.quantity;
        if (t.type === InventoryTransactionType.RETURNED) returned += t.quantity;
      });

      return {
        id: p.id,
        title: p.title,
        price: p.price,
        stock: p.stock,
        available: p.stock - reserved,
        reserved,
        sold,
        returned
      };
    }));

    return summaries;
  }

  async getAlerts() {
    const LOW_STOCK_THRESHOLD = 10;
    const products = await this.productRepository.find({
      where: {
        // Ideally we would query where stock < threshold directly,
        // but since we want to consider reserved stock, we fetch all or handle appropriately.
      }
    });

    const summaries = await this.getSummary();
    const alerts = summaries.filter(s => s.available <= LOW_STOCK_THRESHOLD).map(s => ({
      product_id: s.id,
      title: s.title,
      available: s.available,
      status: s.available <= 0 ? 'Out of Stock' : 'Low Stock'
    }));

    return alerts;
  }

  async processBulkUpdate(fileBuffer: Buffer) {
    const results: any[] = [];
    const stream = Readable.from(fileBuffer.toString());

    return new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          let updatedCount = 0;
          for (const row of results) {
            // Expected CSV format: product_id, stock_change, notes
            const productId = parseInt(row.product_id, 10);
            const stockChange = parseInt(row.stock_change, 10);
            const notes = row.notes || 'Bulk update';

            if (!isNaN(productId) && !isNaN(stockChange)) {
              const product = await this.productRepository.findOne({ where: { id: productId } });
              if (product) {
                // Update product stock directly
                product.stock += stockChange;
                await this.productRepository.save(product);

                // Record transaction
                await this.transactionRepository.save({
                  product_id: productId,
                  type: stockChange > 0 ? InventoryTransactionType.IN : InventoryTransactionType.ADJUSTMENT,
                  quantity: Math.abs(stockChange),
                  notes: notes
                });
                updatedCount++;
              }
            }
          }
          resolve({ success: true, updatedCount });
        })
        .on('error', (err) => reject(new BadRequestException('Error parsing CSV: ' + err.message)));
    });
  }

  async reserveStock(productId: number, quantity: number, orderId: string) {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) throw new Error('Product not found');

    await this.transactionRepository.save({
      product_id: productId,
      type: InventoryTransactionType.RESERVED,
      quantity: quantity,
      reference_id: orderId,
      notes: 'Reserved for order ' + orderId
    });
  }

  async releaseStock(productId: number, quantity: number, orderId: string) {
    await this.transactionRepository.save({
      product_id: productId,
      type: InventoryTransactionType.RESERVED,
      quantity: -quantity, // To offset the reservation
      reference_id: orderId,
      notes: 'Released for order ' + orderId
    });
  }
}
