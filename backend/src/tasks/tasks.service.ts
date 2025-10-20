// src/tasks/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Gathering } from '../gatherings/entities/gathering.entity';
import { Message } from '../messages/entities/message.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Gathering)
    private gatheringRepository: Repository<Gathering>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  /**
   * 매일 새벽 3시에 실행되는 Cron Job.
   * 생성된 지 30일이 지난 모임과 쪽지 데이터를 데이터베이스에서 삭제합니다.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron() {
    this.logger.debug('오래된 데이터 삭제 작업을 시작합니다...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      // 30일이 지난 번개모임 데이터 삭제
      // Gathering 엔티티에 onDelete: 'CASCADE'가 설정되어 있으므로,
      // 관련 participant 및 message 데이터도 함께 자동으로 삭제됩니다.
      const oldGatheringsResult = await this.gatheringRepository.delete({
        createdAt: LessThan(thirtyDaysAgo),
      });
      this.logger.log(`${oldGatheringsResult.affected || 0}개의 오래된 모임 데이터를 삭제했습니다.`);

      // 30일이 지난 쪽지 데이터 삭제
      const oldMessagesResult = await this.messageRepository.delete({
        createdAt: LessThan(thirtyDaysAgo),
      });
      this.logger.log(`${oldMessagesResult.affected || 0}개의 오래된 쪽지 데이터를 삭제했습니다.`);
      
    } catch (error) {
      this.logger.error('오래된 데이터 삭제 작업 중 오류가 발생했습니다.', error.stack);
    }
  }
}
