import { Injectable, OnModuleInit, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductStatus } from '../common/enums';

@Injectable()
export class ProductsService implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async onModuleInit() {
    await this.seedInitialProducts();
  }

  private async seedInitialProducts() {
    const count = await this.productRepository.count();
    if (count === 0) {
      const initialProducts = [
        {
          title: 'Premium Wireless Headphones',
          slug: 'premium-wireless-headphones',
          description: 'High quality noise cancelling headphones.',
          price: 3499,
          sale_price: 2499,
          stock: 100,
          status: ProductStatus.ACTIVE,
          images: JSON.stringify(['assets/headphone_product.png']),
        },
        {
          title: 'Elite Smartwatch Pro',
          slug: 'elite-smartwatch-pro',
          description: 'Health tracking, calls, and notifications on your wrist.',
          price: 4999,
          sale_price: 3999,
          stock: 50,
          status: ProductStatus.ACTIVE,
          images: JSON.stringify(['assets/smartwatch_product.png']),
        },
        {
          title: 'BassBoost Bluetooth Speaker',
          slug: 'bassboost-bluetooth-speaker',
          description: 'Portable waterproof speaker with 24h battery.',
          price: 2299,
          sale_price: 1799,
          stock: 200,
          status: ProductStatus.ACTIVE,
          images: JSON.stringify(['assets/speaker_product.png']),
        },
        {
          title: 'True Wireless Earbuds',
          slug: 'true-wireless-earbuds',
          description: 'Compact earbuds with deep bass and touch controls.',
          price: 1999,
          sale_price: 1499,
          stock: 150,
          status: ProductStatus.ACTIVE,
          images: JSON.stringify(['assets/earbuds_product.png']),
        },
        {
          title: '4K Camera Drone',
          slug: '4k-camera-drone',
          description: 'Foldable drone with 4K camera and 30m flight time.',
          price: 12999,
          sale_price: 8999,
          stock: 20,
          status: ProductStatus.ACTIVE,
          images: JSON.stringify(['assets/drone_product.png']),
        },
        {
          title: '65W Fast Charger',
          slug: '65w-fast-charger',
          description: 'Dual-port GaN fast charger for laptops and phones.',
          price: 1299,
          sale_price: 899,
          stock: 300,
          status: ProductStatus.ACTIVE,
          images: JSON.stringify(['assets/charger_product.png']),
        },
      ];

      for (const p of initialProducts) {
        await this.productRepository.save(this.productRepository.create(p));
      }
      this.logger.log('Seeded 6 initial products from the landing page.');
    }
  }

  async findAll(includeAll = false, query?: any) {
    const qb = this.productRepository.createQueryBuilder('product');
    
    if (!includeAll) {
      qb.where('product.status = :status', { status: ProductStatus.ACTIVE });
    } else {
      qb.where('1=1');
    }

    if (query) {
      if (query.category) {
        qb.andWhere('product.category = :category', { category: query.category });
      }
      if (query.brand) {
        const brands = Array.isArray(query.brand) ? query.brand : query.brand.split(',');
        qb.andWhere('product.brand IN (:...brands)', { brands });
      }
      if (query.minPrice) {
        qb.andWhere('product.price >= :minPrice', { minPrice: parseFloat(query.minPrice) });
      }
      if (query.maxPrice) {
        qb.andWhere('product.price <= :maxPrice', { maxPrice: parseFloat(query.maxPrice) });
      }
      if (query.minRating) {
        qb.andWhere('product.averageRating >= :minRating', { minRating: parseFloat(query.minRating) });
      }
      if (query.isFeatured) {
        qb.andWhere('product.isFeatured = :isFeatured', { isFeatured: query.isFeatured === 'true' });
      }
      if (query.search) {
        qb.andWhere('(product.title ILIKE :search OR product.description ILIKE :search OR product.brand ILIKE :search)', { search: `%${query.search}%` });
      }
      
      if (query.sort) {
        switch (query.sort) {
          case 'price_asc':
            qb.orderBy('product.price', 'ASC');
            break;
          case 'price_desc':
            qb.orderBy('product.price', 'DESC');
            break;
          case 'newest':
            qb.orderBy('product.created_at', 'DESC');
            break;
          case 'rating':
            qb.orderBy('product.averageRating', 'DESC');
            break;
          default:
            qb.orderBy('product.created_at', 'DESC');
        }
      } else {
        qb.orderBy('product.created_at', 'DESC');
      }
      
      if (query.limit) {
        qb.take(parseInt(query.limit, 10));
      }
    } else {
      qb.orderBy('product.created_at', 'DESC');
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(createProductDto: any) {
    const product = this.productRepository.create(createProductDto as Partial<Product>);
    if (!(product as any).slug) {
      (product as any).slug = (product as any).title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    return this.productRepository.save(product);
  }

  async update(id: number, updateProductDto: any) {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async bulkUpdateStatus(ids: number[], status: ProductStatus) {
    if (!ids || ids.length === 0) return { affected: 0 };
    return this.productRepository.update(ids, { status });
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    product.status = ProductStatus.ARCHIVED;
    return this.productRepository.save(product);
  }
}
