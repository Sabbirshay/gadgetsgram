import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UserRole } from '../common/enums';

@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL', 'admin@gadgetsgram.com');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD', 'Admin@123456');

    const adminExists = await this.userRepository.findOne({ where: { email: adminEmail } });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      const admin = this.userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        name: 'System Admin',
        role: UserRole.SUPER_ADMIN,
        is_active: true,
      });

      await this.userRepository.save(admin);
      this.logger.log(`Super Admin user created with email: ${adminEmail}`);
    } else {
      this.logger.log('Admin user already exists, skipping seed.');
    }
  }
}
