import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  user_id: number;

  @Column()
  action: string; // 'create' | 'update' | 'delete' | 'login' | 'logout'

  @Column()
  entity: string; // 'order' | 'product' | 'user' etc.

  @Column({ nullable: true })
  entity_id: number;

  @Column({ type: 'text', nullable: true })
  changes: string; // JSON of what changed

  @Column({ nullable: true })
  ip_address: string;

  @CreateDateColumn()
  created_at: Date;
}
