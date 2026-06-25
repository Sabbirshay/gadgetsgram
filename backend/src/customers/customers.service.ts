import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll() {
    return this.customerRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number) {
    return this.customerRepository.findOne({ 
      where: { id },
      relations: { orders: true } // TypeORM 0.3+ syntax
    });
  }
}
