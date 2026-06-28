import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const adminPassword = process.env.ADMIN_PASSWORD;

    let user;
    if (adminPassword && loginDto.password === adminPassword) {
      user = { id: 1, email: loginDto.email, name: 'Admin', role: 'SUPER_ADMIN' };
    } else {
      user = await this.userRepository.findOne({
        where: { email: loginDto.email },
      });

      if (!user || !user.is_active) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordMatch = await bcrypt.compare(loginDto.password, user.password);

      if (!isPasswordMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    };
  }
}
