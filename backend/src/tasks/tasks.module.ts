import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Gathering } from '../gatherings/entities/gathering.entity';
import { Message } from '../messages/entities/message.entity';
import { TradesModule } from '../trades/trades.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gathering, Message]),
    TradesModule,
  ],
  providers: [TasksService],
})
export class TasksModule {}