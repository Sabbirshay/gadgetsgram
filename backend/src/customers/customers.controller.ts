import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { Roles, Public } from '../common/decorators';
import { UserRole } from '../common/enums';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Public()
  @Post('register')
  async register(@Body() body: any) {
    return this.customersService.register(body);
  }

  @Public()
  @Post('login')
  async login(@Body() body: any) {
    return this.customersService.login(body);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.customersService.getProfile(req.user.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req: any, @Body() body: any) {
    return this.customersService.updateProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER_SUPPORT)
  @Get()
  async findAll() {
    return this.customersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER_SUPPORT)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('profile/wishlist')
  async getWishlist(@Request() req: any) {
    return this.customersService.getWishlist(req.user.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('profile/wishlist/:productId')
  async addToWishlist(@Request() req: any, @Param('productId', ParseIntPipe) productId: number) {
    return this.customersService.addToWishlist(req.user.id, productId);
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete('profile/wishlist/:productId')
  async removeFromWishlist(@Request() req: any, @Param('productId', ParseIntPipe) productId: number) {
    return this.customersService.removeFromWishlist(req.user.id, productId);
  }
}
