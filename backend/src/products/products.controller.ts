import {
  Controller, Get, Post, Put, Delete, Param, Body,
  ParseIntPipe, UseGuards, UseInterceptors, UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ProductsService } from './products.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Public, Roles } from '../common/decorators';
import { UserRole } from '../common/enums';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';


@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Public()
  @Get()
  async findAll() {
    return this.productsService.findAll(); // Only active products
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MARKETING, UserRole.INVENTORY_MANAGER)
  @Get('admin/all')
  async findAllAdmin() {
    return this.productsService.findAll(true); // All products including archived
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @Post()
  async create(@Body() createProductDto: any) {
    return this.productsService.create(createProductDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg\+xml)$/)) {
          cb(new BadRequestException('Only image files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    
    try {
      const result = await this.cloudinaryService.uploadImage(file);
      return { url: result.secure_url };
    } catch (error) {
      throw new BadRequestException('Failed to upload image to Cloudinary');
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @Put('bulk/status')
  async bulkUpdateStatus(@Body() body: { ids: number[], status: string }) {
    if (!body.ids || !body.status) {
      throw new BadRequestException('Missing ids or status');
    }
    return this.productsService.bulkUpdateStatus(body.ids, body.status as any);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: any) {
    return this.productsService.update(id, updateProductDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
