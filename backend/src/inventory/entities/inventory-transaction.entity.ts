import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { InventoryTransactionType } from '../../common/enums';

@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    type: 'varchar',
    enum: InventoryTransactionType,
  })
  type: InventoryTransactionType;

  @Column('int')
  quantity: number;

  @Column({ nullable: true })
  reference_id: string; // e.g., Order ID

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
