import { Module } from '@nestjs/common';
import { CourierService } from './courier.service';

@Module({
  providers: [CourierService],
})
export class CourierModule {}
