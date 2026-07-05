import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true, type: 'text' })
  address: string;

  @Column({ nullable: true, unique: true })
  uid: string;

  @Column({ default: 0 })
  orders_count: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  lifetime_value: number;

  @Column({ nullable: true })
  last_order_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];
}
