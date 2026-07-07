import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
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
      let customer = await this.customerRepository.findOne({ where: { phone } });
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

    const customer = await this.customerRepository.findOne({ where: { uid: data.user.id } });

    return {
      accessToken: data.session.access_token,
      user: customer || data.user,
    };
  }

  private async findOrCreateCustomer(user: any, relations: any = {}): Promise<Customer> {
    let customer = await this.customerRepository.findOne({
      where: { uid: user.id },
      relations,
    });
    
    if (!customer) {
      const email = user.email || '';
      const phone = user.phone || user.user_metadata?.phone || '';
      
      if (phone) {
        customer = await this.customerRepository.findOne({ where: { phone }, relations });
      }
      
      if (!customer) {
        customer = this.customerRepository.create({
          uid: user.id,
          email: email,
          name: user.user_metadata?.name || 'Customer',
          phone: phone,
          address: '',
        });
      } else {
        // Link existing customer to the Supabase ID
        customer.uid = user.id;
        if (email && !customer.email) customer.email = email;
      }
      
      await this.customerRepository.save(customer);
    }
    
    return customer;
  }

  async getProfile(user: any) {
    return this.findOrCreateCustomer(user, { orders: { product: true } });
  }

  async updateProfile(user: any, updateDto: any) {
    const customer = await this.findOrCreateCustomer(user);
    
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
      relations: { orders: true }
    });
  }

  async getWishlist(user: any) {
    const customer = await this.findOrCreateCustomer(user, { wishlist: true });
    return customer.wishlist;
  }

  async addToWishlist(user: any, productId: number) {
    const customer = await this.findOrCreateCustomer(user, { wishlist: true });

    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) throw new BadRequestException('Product not found');

    // Add if not already in wishlist
    if (!customer.wishlist.some(p => p.id === productId)) {
      customer.wishlist.push(product);
      await this.customerRepository.save(customer);
    }
    return customer.wishlist;
  }

  async removeFromWishlist(user: any, productId: number) {
    const customer = await this.findOrCreateCustomer(user, { wishlist: true });

    customer.wishlist = customer.wishlist.filter(p => p.id !== productId);
    await this.customerRepository.save(customer);
    return customer.wishlist;
  }
}
