import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CampusStatusMessage } from './entities/campus-status-message.entity';
import { CampusStatusSummary } from './entities/campus-status-summary.entity';
import { CampusPrediction } from './entities/campus-prediction.entity';
import { CreateCampusStatusDto } from './dto/create-campus-status.dto';
import { User } from '../users/user.entity';
import { University } from '../universities/entities/university.entity';
import axios from 'axios';

@Injectable()
export class CampusStatusService {
  private readonly logger = new Logger(CampusStatusService.name);

  constructor(
    @InjectRepository(CampusStatusMessage)
    private messageRepository: Repository<CampusStatusMessage>,
    @InjectRepository(CampusStatusSummary)
    private summaryRepository: Repository<CampusStatusSummary>,
    @InjectRepository(CampusPrediction)
    private predictionRepository: Repository<CampusPrediction>,
    @InjectRepository(University)
    private universityRepository: Repository<University>,
    @InjectQueue('campus-status-queue') private statusQueue: Queue,
  ) {}

  private async getUniversityIdByUser(user: User): Promise<number> {
    const university = await this.universityRepository.findOne({
      where: { name: user.university },
    });

    if (!university) {
      throw new NotFoundException('User university information not found');
    }
    return university.id;
  }

  async createReport(createDto: CreateCampusStatusDto, user: User): Promise<CampusStatusMessage> {
    const universityId = await this.getUniversityIdByUser(user);

    const report = this.messageRepository.create({
      content: createDto.content,
      category: createDto.category,
      weatherCondition: createDto.weatherCondition,
      author: user,
      universityId: universityId,
      isVerified: true,
    });

    const saved = await this.messageRepository.save(report);
    this.logger.log(`New Report Created: [${saved.category}] ${saved.content}`);
    return saved;
  }

  async getLatestSummary(user: User): Promise<CampusStatusSummary> {
    const universityId = await this.getUniversityIdByUser(user);

    return await this.summaryRepository.findOne({
      where: { universityId: universityId },
      order: { createdAt: 'DESC' },
    });
  }

  async getPrediction(user: User, day: string) {
    const universityId = await this.getUniversityIdByUser(user);
    
    const prediction = await this.predictionRepository.findOne({
        where: { universityId, dayOfWeek: day }
    });

    if (!prediction) {
        return { status: 'empty', message: '아직 예측 데이터가 생성되지 않았습니다.' };
    }

    return { status: 'success', timeline: prediction.timeline };
  }

  @Cron('0 4 * * 0') 
  async scheduleWeeklyTraining() {
    this.logger.log('Starting weekly ML training for all universities...');
    try {
        await axios.post('http://127.0.0.1:8000/train-all');
        this.logger.log('Weekly training request sent successfully.');
    } catch (error) {
        this.logger.error(`Weekly training failed: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduleSummaryGeneration() {
    this.logger.debug('Cron Scheduler Triggered: Checking active universities...');

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const activeUniversities = await this.messageRepository
      .createQueryBuilder('message')
      .select('DISTINCT message.universityId', 'universityId')
      .where('message.createdAt > :tenMinutesAgo', { tenMinutesAgo })
      .getRawMany();

    if (activeUniversities.length === 0) {
        this.logger.debug('No active reports found in any university.');
        return;
    }

    this.logger.log(`Found ${activeUniversities.length} active universities with new reports.`);
    
    for (const item of activeUniversities) {
      const universityId = item.universityId;
      this.logger.debug(`Adding summary job for University ID: ${universityId}`);
      
      await this.statusQueue.add(
        'generate-summary',
        { universityId },
        { removeOnComplete: true, removeOnFail: true }
      );
    }
  }
}