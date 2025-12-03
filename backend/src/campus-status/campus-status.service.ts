import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm'; 
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config'; 
import OpenAI from 'openai'; 

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
  private openai: OpenAI;

  constructor(
    @InjectRepository(CampusStatusMessage)
    private messageRepository: Repository<CampusStatusMessage>,
    @InjectRepository(CampusStatusSummary)
    private summaryRepository: Repository<CampusStatusSummary>,
    @InjectRepository(CampusPrediction)
    private predictionRepository: Repository<CampusPrediction>,
    @InjectRepository(University)
    private universityRepository: Repository<University>,
    private configService: ConfigService, 
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('FATAL ERROR: OPENAI_API_KEY is missing in .env file!');
    }
    this.openai = new OpenAI({ apiKey });
  }

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

    this.logger.log(`Found ${activeUniversities.length} active universities. Starting direct processing...`);
    
    for (const item of activeUniversities) {
      const universityId = item.universityId;
      await this.processSummary(universityId); 
    }
  }

  async processSummary(universityId: number): Promise<void> {
    this.logger.log(`Processing Summary for University ID: ${universityId}`);

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const messages = await this.messageRepository.find({
      where: {
        universityId,
        createdAt: MoreThan(tenMinutesAgo),
      },
      order: { createdAt: 'ASC' },
    });

    if (messages.length === 0) {
      this.logger.log(`University ${universityId}: No messages to summarize.`);
      return;
    }

    const summaryData = await this.generateSummaryWithAI(messages);

    if (!summaryData || !Array.isArray(summaryData)) {
      this.logger.error(`University ${universityId}: AI returned invalid format.`);
      return;
    }

    const summary = this.summaryRepository.create({
      breakdown: summaryData, 
      universityId,
      validUntil: new Date(Date.now() + 10 * 60 * 1000), 
    });

    await this.summaryRepository.save(summary);
    this.logger.log(`University ${universityId}: Summary Saved successfully.`);
  }

  private async generateSummaryWithAI(messages: CampusStatusMessage[]) {
    const messageTexts = messages.map(
      (m) => `[${m.category}] ${m.content}`
    ).join('\n');

    const prompt = `
      You are an AI reporter for a university campus.
      Analyze the following real-time reports and generate a structured summary JSON.

      Raw Reports:
      ${messageTexts}

      [Instructions]
      1. Group reports by their topic (Traffic, Cafeteria, Event, Weather, Etc).
      2. For each group, write a **detailed summary** that includes specific locations and the situation.
      3. **Do not be vague.**
      4. Calculate 'confidence' (0-100%).
      5. Count 'reportCount'.
      6. Output must be a valid JSON Array. Korean language only.

      [Output JSON Structure]
      [
        {
          "category": "TRAFFIC" | "CAFETERIA" | "EVENT" | "WEATHER" | "ETC",
          "summary": "Specific detailed summary...",
          "confidence": 85,
          "reportCount": 5
        }
      ]
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful campus AI reporter.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3, 
      });

      let content = completion.choices[0].message.content;
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('AI Generation Failed:', error);
      return null;
    }
  }
}