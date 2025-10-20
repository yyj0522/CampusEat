import { Module } from '@nestjs/common';
import { ShuttlesService } from './shuttles.service';
import { ShuttlesController } from './shuttles.controller';

@Module({
  controllers: [ShuttlesController],
  providers: [ShuttlesService],
})
export class ShuttlesModule {}
