import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express';
import { join } from 'path';
import { Public } from './common/decorators';
import { SupabaseService } from './supabase/supabase.service';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
    private readonly dataSource: DataSource,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('admin')
  getAdmin(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', 'public', 'admin.html'));
  }

  @Public()
  @Get('profile')
  getProfile(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  }

  @Public()
  @Get('track')
  getTrack(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  }

  @Public()
  @Get('order/success')
  getOrderSuccess(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  }

  @Public()
  @Get('health')
  async getHealth() {
    let dbStatus = 'healthy';
    let dbError = null;
    try {
      await this.dataSource.query('SELECT 1');
    } catch (e) {
      dbStatus = 'unhealthy';
      dbError = e.message;
    }

    let supabaseStatus = 'healthy';
    let supabaseError = null;
    try {
      const client = this.supabaseService.getClient();
    } catch (e) {
      supabaseStatus = 'unhealthy';
      supabaseError = e.message;
    }

    return {
      status: dbStatus === 'healthy' && supabaseStatus === 'healthy' ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        error: dbError,
      },
      supabase: {
        status: supabaseStatus,
        error: supabaseError,
      },
    };
  }
}
