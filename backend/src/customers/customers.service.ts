import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
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

    return {
      accessToken: data.session.access_token,
      user: data.user,
    };
  }

  async getProfile(uid: string) {
    return this.customerRepository.findOne({
      where: { uid },
      relations: { orders: true },
    });
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
}
