import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('courier_shipments')
export class CourierShipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @Column()
  courier_name: string; // 'steadfast' | 'pathao' | 'redx' | 'mock'

  @Column({ nullable: true })
  tracking_id: string;

  @Column({ default: 'pending' })
  status: string; // 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'returned'

  @Column({ nullable: true })
  booked_at: Date;

  @Column({ nullable: true })
  delivered_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
