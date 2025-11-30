import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { CampusStatusController } from './campus-status.controller';
import { CampusStatusService } from './campus-status.service';
import { CampusStatusProcessor } from './campus-status.processor';
import { CampusStatusMessage } from './entities/campus-status-message.entity';
import { CampusStatusSummary } from './entities/campus-status-summary.entity';
import { CampusPrediction } from './entities/campus-prediction.entity';
import { University } from '../universities/entities/university.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
        CampusStatusMessage, 
        CampusStatusSummary, 
        CampusPrediction,
        University
    ]),
    BullModule.registerQueue({
      name: 'campus-status-queue',
    }),
    ConfigModule,
    AuthModule,
  ],
  controllers: [CampusStatusController],
  providers: [CampusStatusService, CampusStatusProcessor],
  exports: [CampusStatusService],
})
export class CampusStatusModule {}