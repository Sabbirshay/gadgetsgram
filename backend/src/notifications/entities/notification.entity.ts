import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  order_id: number;

  @Column()
  channel: string; // 'sms' | 'whatsapp' | 'email'

  @Column()
  type: string; // 'order_received' | 'order_confirmed' | 'courier_booked' | 'delivered'

  @Column({ default: 'pending' })
  status: string; // 'pending' | 'sent' | 'failed'

  @Column({ type: 'text', nullable: true })
  payload: string; // JSON payload

  @Column({ nullable: true })
  sent_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
