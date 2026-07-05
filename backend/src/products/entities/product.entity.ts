import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductStatus } from '../../common/enums';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sale_price: number;

  @Column({ nullable: true })
  nameEn: string;

  @Column({ nullable: true })
  nameBn: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ type: 'simple-json', nullable: true })
  specs: string[];

  @Column({ nullable: true })
  category: string;

  @Column({ default: true })
  inStock: boolean;

  @Column({ default: 0 })
  stock: number;

  @Column({ type: 'text', nullable: true })
  images: string; // JSON string array of image URLs

  @Column({ type: 'varchar', default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @Column({ nullable: true })
  brand: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: false })
  isFeatured: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
