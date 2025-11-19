import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';
import { PdfParserService } from './pdf-parser.service';
import { HtmlScraperService } from './html-scraper.service';
import { DynamicScraperService } from './dynamic-scraper.service';
import { Lecture } from './lecture.entity';
import { Timetable } from './timetable.entity';
import { TimetableLecture } from './timetable-lecture.entity'; 
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lecture, Timetable, TimetableLecture]), 
    AuthModule,
  ],
  controllers: [TimetableController],
  providers: [
    TimetableService,
    PdfParserService,
    HtmlScraperService,
    DynamicScraperService
  ],
})
export class TimetableModule {}