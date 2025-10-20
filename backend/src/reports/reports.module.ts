// src/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { AuthModule } from '../auth/auth.module';
// ✅ Gathering 엔티티를 임포트합니다.
import { Gathering } from '../gatherings/entities/gathering.entity';

@Module({
  imports: [
    // ✅ ReportsService가 GatheringRepository를 주입받을 수 있도록 추가합니다.
    TypeOrmModule.forFeature([Report, Gathering]),
    AuthModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
