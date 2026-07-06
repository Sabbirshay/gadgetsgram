import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { SupabaseService } from '../supabase/supabase.service';

import { Product } from '../products/entities/product.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly supabaseService: SupabaseService,
  ) {}

  async register(registerDto: any) {
    const supabase = this.supabaseService.getClient();
    const { email, password, name, phone } = registerDto;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (data.user) {
      let customer = await this.customerRepository.findOne({
        where: { phone },
      });
      if (!customer) {
        customer = this.customerRepository.create({
          uid: data.user.id,
          email,
          name,
          phone,
        });
      } else {
        customer.uid = data.user.id;
        customer.email = email;
        if (name) customer.name = name;
      }
      await this.customerRepository.save(customer);
    }

    return { message: 'Registration successful', user: data.user };
  }

  async login(loginDto: any) {
    const supabase = this.supabaseService.getClient();
    const { email, password } = loginDto;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    const customer = await this.customerRepository.findOne({
      where: { uid: data.user.id },
    });

    return {
      accessToken: data.session.access_token,
      user: customer || data.user,
    };
  }

  async getProfile(uid: string) {
    return this.customerRepository.findOne({
      where: { uid },
      relations: { orders: { product: true } },
    });
  }

  async updateProfile(uid: string, updateDto: any) {
    const customer = await this.customerRepository.findOne({ where: { uid } });
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    if (updateDto.name !== undefined) customer.name = updateDto.name;
    if (updateDto.phone !== undefined) customer.phone = updateDto.phone;
    if (updateDto.address !== undefined) customer.address = updateDto.address;

    return this.customerRepository.save(customer);
  }

  async findAll() {
    return this.customerRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number) {
    return this.customerRepository.findOne({
      where: { id },
      relations: { orders: true },
    });
  }

  async getWishlist(uid: string) {
    const customer = await this.customerRepository.findOne({
      where: { uid },
      relations: { wishlist: true },
    });
    if (!customer) throw new BadRequestException('Customer not found');
    return customer.wishlist;
  }

  async addToWishlist(uid: string, productId: number) {
    const customer = await this.customerRepository.findOne({
      where: { uid },
      relations: { wishlist: true },
    });
    if (!customer) throw new BadRequestException('Customer not found');

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) throw new BadRequestException('Product not found');

    // Add if not already in wishlist
    if (!customer.wishlist.some((p) => p.id === productId)) {
      customer.wishlist.push(product);
      await this.customerRepository.save(customer);
    }
    return customer.wishlist;
  }

  async removeFromWishlist(uid: string, productId: number) {
    const customer = await this.customerRepository.findOne({
      where: { uid },
      relations: { wishlist: true },
    });
    if (!customer) throw new BadRequestException('Customer not found');

    customer.wishlist = customer.wishlist.filter((p) => p.id !== productId);
    await this.customerRepository.save(customer);
    return customer.wishlist;
  }
}
