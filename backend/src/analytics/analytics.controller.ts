import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../common/decorators';
import { UserRole } from '../common/enums';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('dashboard-kpis')
  async getDashboardKpis() {
    return this.analyticsService.getDashboardKpis();
  }
}
