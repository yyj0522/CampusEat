import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Gathering } from '../gatherings/entities/gathering.entity';
import { Message } from '../messages/entities/message.entity';
import { TradesService } from '../trades/trades.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Gathering)
    private gatheringRepository: Repository<Gathering>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private readonly tradesService: TradesService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron() {
    this.logger.debug('오래된 데이터 삭제 작업을 시작합니다...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const oldGatheringsResult = await this.gatheringRepository.delete({
        createdAt: LessThan(thirtyDaysAgo),
      });
      this.logger.log(`${oldGatheringsResult.affected || 0}개의 오래된 모임 데이터를 삭제했습니다.`);

      const oldMessagesResult = await this.messageRepository.delete({
        createdAt: LessThan(thirtyDaysAgo),
      });
      this.logger.log(`${oldMessagesResult.affected || 0}개의 오래된 쪽지 데이터를 삭제했습니다.`);
      
      this.logger.debug('오래된 중고거래 데이터 삭제 작업을 시작합니다...');
      await this.tradesService.removeExpiredTrades();

    } catch (error) {
      this.logger.error('오래된 데이터 삭제 작업 중 오류가 발생했습니다.', error.stack);
    }
  }
}