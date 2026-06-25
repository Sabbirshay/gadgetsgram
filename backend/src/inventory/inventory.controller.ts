import { Controller, Get, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('summary')
  async getSummary() {
    return this.inventoryService.getSummary();
  }

  @Get('alerts')
  async getAlerts() {
    return this.inventoryService.getAlerts();
  }

  @Post('bulk-update')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpdate(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are allowed');
    }
    return this.inventoryService.processBulkUpdate(file.buffer);
  }
}
