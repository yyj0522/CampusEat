import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';
import { PdfParserService } from './pdf-parser.service';
import { HtmlScraperService } from './html-scraper.service';
import { DynamicScraperService } from './dynamic-scraper.service';
import { DataValidatorService } from './validation/data-validator.service';
import { AiValidatorService } from './validation/ai-validator.service';
import { RedisManagerService } from '../common/redis/redis-manager.service';
import { Lecture } from './lecture.entity';
import { Timetable } from './timetable.entity';
import { TimetableLecture } from './timetable-lecture.entity';
import { LectureReview } from './lecture-review.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lecture, Timetable, TimetableLecture, LectureReview]),
    AuthModule,
  ],
  controllers: [TimetableController],
  providers: [
    TimetableService,
    PdfParserService,
    HtmlScraperService,
    DynamicScraperService,
    DataValidatorService,
    AiValidatorService,
    RedisManagerService,
  ],
})
export class TimetableModule {}