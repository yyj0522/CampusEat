// src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Gathering } from '../gatherings/entities/gathering.entity';
import { Message } from '../messages/entities/message.entity';

@Module({
  imports: [
    // TasksService가 DB에 접근할 수 있도록 해당 엔티티의 Repository를 등록합니다.
    TypeOrmModule.forFeature([Gathering, Message]),
  ],
  providers: [TasksService],
})
export class TasksModule {}
