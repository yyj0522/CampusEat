import { Module } from '@nestjs/common';
import { GatheringsService } from './gatherings.service';
import { GatheringsController } from './gatherings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gathering } from './entities/gathering.entity';
import { GatheringParticipant } from './entities/gathering-participant.entity';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/user.entity';
import { GatheringMessage } from './entities/gathering-message.entity';
import { GatheringsGateway } from './gatherings.gateway';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Gathering, 
      GatheringParticipant, 
      User, 
      GatheringMessage
    ]),
    AuthModule,
    ReportsModule, 
  ],
  controllers: [GatheringsController],
  providers: [GatheringsService, GatheringsGateway],
})
export class GatheringsModule {}
