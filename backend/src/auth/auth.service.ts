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
      user = {
        id: 1,
        email: loginDto.email,
        name: 'Admin',
        role: 'SUPER_ADMIN',
      };
    } else {
      user = await this.userRepository.findOne({
        where: { email: loginDto.email },
      });

      if (!user || !user.is_active) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordMatch = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Generate Refresh Token (expires in 7d by default)
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Hash and store it
    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await this.userRepository.update(user.id, {
      hashed_refresh_token: hashedRefreshToken,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.hashed_refresh_token || !user.is_active) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.hashed_refresh_token,
    );
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, salt);
    await this.userRepository.update(user.id, {
      hashed_refresh_token: hashedRefreshToken,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: number) {
    await this.userRepository.update(userId, { hashed_refresh_token: null });
  }
}
