import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CampusStatusController } from './campus-status.controller';
import { CampusStatusService } from './campus-status.service';
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
    ConfigModule,
    AuthModule,
  ],
  controllers: [CampusStatusController],
  providers: [
    CampusStatusService, 
  ],
  exports: [CampusStatusService],
})
export class CampusStatusModule {}