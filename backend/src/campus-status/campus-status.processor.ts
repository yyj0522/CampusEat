import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { CampusStatusMessage } from './entities/campus-status-message.entity';
import { CampusStatusSummary } from './entities/campus-status-summary.entity';

@Processor('campus-status-queue')
export class CampusStatusProcessor extends WorkerHost {
  private readonly logger = new Logger(CampusStatusProcessor.name);
  private openai: OpenAI;

  constructor(
    @InjectRepository(CampusStatusMessage)
    private messageRepository: Repository<CampusStatusMessage>,
    @InjectRepository(CampusStatusSummary)
    private summaryRepository: Repository<CampusStatusSummary>,
    private configService: ConfigService,
  ) {
    super();
    
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('FATAL ERROR: OPENAI_API_KEY is missing in .env file!');
    } else {
      this.logger.log('OpenAI API Key loaded successfully.');
    }

    this.openai = new OpenAI({ apiKey });
  }

  @OnWorkerEvent('ready')
  onReady() {
    this.logger.log('Worker is connected to Redis and ready to process jobs!');
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} started! Processing...`);
  }

  @OnWorkerEvent('error')
  onError(err: Error) {
    this.logger.error(`Worker Error: ${err.message}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${err.message}`);
  }

  async process(job: Job<{ universityId: number }>): Promise<void> {
    const { universityId } = job.data;
    this.logger.log(`Processing Summary for University ID: ${universityId}`);

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    this.logger.debug(`Querying messages created after: ${tenMinutesAgo.toISOString()} (UTC)`);

    const messages = await this.messageRepository.find({
      where: {
        universityId,
        createdAt: MoreThan(tenMinutesAgo),
      },
      order: { createdAt: 'ASC' },
    });

    this.logger.log(`Found ${messages.length} recent messages for analysis.`);

    if (messages.length === 0) {
      this.logger.log('No messages to summarize. Skipping.');
      return;
    }

    const summaryData = await this.generateSummaryWithAI(messages);

    if (!summaryData || !Array.isArray(summaryData)) {
      this.logger.error('AI returned invalid format.');
      return;
    }

    const summary = this.summaryRepository.create({
      breakdown: summaryData, 
      universityId,
      validUntil: new Date(Date.now() + 10 * 60 * 1000), 
    });

    await this.summaryRepository.save(summary);
    this.logger.log(`Summary Saved with ${summaryData.length} categories.`);
  }

  private async generateSummaryWithAI(messages: CampusStatusMessage[]) {
    const messageTexts = messages.map(
      (m) => `[${m.category}] ${m.content}`
    ).join('\n');

    this.logger.debug('Calling OpenAI API...');

    const prompt = `
      You are an AI reporter for a university campus.
      Analyze the following real-time reports and generate a structured summary JSON.

      Raw Reports:
      ${messageTexts}

      [Instructions]
      1. Group reports by their topic (Traffic, Cafeteria, Event, Weather, Etc).
      2. For each group, write a **detailed summary** that includes specific locations (e.g., "Dujeong Station", "Student Hall") and the specific situation.
      3. **Do not be vague.** (Bad: "Shuttle is busy", Good: "Long line at Dujeong Station shuttle stop, consider taking a taxi").
      4. Calculate 'confidence' (0-100%) based on the number of similar reports and consensus. More reports = Higher confidence.
      5. Count the number of relevant reports for each group ('reportCount').
      6. Output must be a valid JSON Array. Korean language only.

      [Output JSON Structure]
      [
        {
          "category": "TRAFFIC" | "CAFETERIA" | "EVENT" | "WEATHER" | "ETC",
          "summary": "Specific detailed summary here...",
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
      
      this.logger.debug(`OpenAI Response: ${content}`);
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('AI Generation Failed:', error);
      return null;
    }
  }
}