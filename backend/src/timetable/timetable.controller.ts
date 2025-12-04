import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Logger,
  Get,
  Query,
  UseGuards,
  Put,
  Param,
  HttpCode,
  HttpStatus,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfParserService } from './pdf-parser.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Lecture, ScheduleItem } from './lecture.entity';
import { StandardizedTimetable } from './timetable.interface';
import { HtmlScraperService } from './html-scraper.service';
import { DynamicScraperService } from './dynamic-scraper.service';
import { TimetableService } from './timetable.service';
import { DataValidatorService } from './validation/data-validator.service';
import { AiValidatorService } from './validation/ai-validator.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { GenerateTimetableDto } from './dto/generate-timetable.dto';
import { Throttle } from '@nestjs/throttler';

interface TimetableSaveDto extends StandardizedTimetable {}

@Controller('timetable')
export class TimetableController {
  private readonly logger = new Logger(TimetableController.name);

  constructor(
    private readonly pdfParser: PdfParserService,
    private readonly htmlScraper: HtmlScraperService,
    private readonly dynamicScraper: DynamicScraperService,
    private readonly timetableService: TimetableService,
    private readonly dataValidator: DataValidatorService,
    private readonly aiValidator: AiValidatorService,
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
  ) {}

  @Get('lectures')
  @UseGuards(AuthGuard())
  async findAllLectures(@GetUser() user: User): Promise<Lecture[]> {
    if (!user.university) {
      return [];
    }
    const baseUniversity = user.university.replace(/\(.*\)/, '').trim();
    return this.lectureRepository.find({ where: { university: baseUniversity } });
  }
  
  @Post('lectures/stats')
  @UseGuards(AuthGuard())
  async getLectureStats(@Body() body: { ids: number[] }) {
    return this.timetableService.getLectureStats(body.ids);
  }

  @Post('lectures/:id/reviews')
  @UseGuards(AuthGuard())
  async createReview(@GetUser() user: User, @Param('id') lectureId: number, @Body() body: { content: string; rating: number; year: number; semester: string; isAnonymous: boolean }) {
    return this.timetableService.createReview(user, lectureId, body.content, body.rating, body.year, body.semester, body.isAnonymous);
  }

  @Get('lectures/:id/reviews')
  @UseGuards(AuthGuard())
  async getReviews(@GetUser() user: User, @Param('id') lectureId: number) {
    return this.timetableService.getReviews(lectureId, user);
  }

  @Delete('reviews/:id')
  @UseGuards(AuthGuard())
  async deleteReview(@GetUser() user: User, @Param('id') reviewId: number) {
    return this.timetableService.deleteReview(user, reviewId);
  }

  @Post('preview/pdf')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file'))
  async previewPdfTimetable(@UploadedFile() file: Express.Multer.File, @Body('year') year: string, @Body('semester') semester: string, @Body('universityId') universityId: string, @Body('useAi') useAi: string) {
    if (!file) return { message: '파일이 필요합니다.' };
    const yearNum = parseInt(year) || new Date().getFullYear();
    const semesterStr = semester || 'N/A';
    const standardJson = await this.pdfParser.parsePdf(file.buffer, yearNum, semesterStr, universityId);
    const validationResult = this.dataValidator.validate(standardJson);
    if (useAi === 'true') {
      await this.aiValidator.validate(standardJson, validationResult);
    }
    return { data: standardJson, validation: validationResult };
  }

  @Post('preview/scrape')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async previewScrapeTimetable(@Body('url') url: string, @Body('year') year: string, @Body('semester') semester: string, @Body('universityId') universityId: string) {
    if (!url) return { message: 'URL이 필요합니다.' };
    const yearNum = parseInt(year) || new Date().getFullYear();
    const semesterStr = semester || 'N/A';
    const result = await this.htmlScraper.parseUrl(url, yearNum, semesterStr, universityId);
    const validation = this.dataValidator.validate(result);
    return { data: result, validation };
  }

  @Post('preview/scrape-dynamic')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async previewDynamicScrapeTimetable(@Body('url') url: string, @Body('year') year: string, @Body('semester') semester: string, @Body('universityId') universityId: string) {
    if (!url) return { message: 'URL이 필요합니다.' };
    const yearNum = parseInt(year) || new Date().getFullYear();
    const semesterStr = semester || 'N/A';
    const result = await this.dynamicScraper.parseUrl(url, yearNum, semesterStr, universityId);
    const validation = this.dataValidator.validate(result);
    return { data: result, validation };
  }

  @Post('save')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async saveTimetable(@Body() dto: TimetableSaveDto) {
    this.logger.log(`[저장 시작] ${dto.lectures.length}개 강의`);

    const lecturesToSave: Lecture[] = [];
    let updateCount = 0;
    let insertCount = 0;

    await Promise.all(
      dto.lectures.map(async (lec) => {
        const existingLecture = await this.lectureRepository.findOne({
          where: {
            university: dto.university,
            year: dto.year,
            semester: dto.semester,
            courseCode: lec.courseCode,
            campus: lec.campus,
          },
        });

        const lectureData = {
          ...lec,
          university: dto.university,
          campus: lec.campus || dto.campus,
          department: lec.department || dto.department,
          major: lec.major || dto.major,
          year: dto.year,
          semester: dto.semester,
          courseType: dto.courseType,
        };

        if (existingLecture) {
          const updatedLecture = this.lectureRepository.merge(
            existingLecture,
            lectureData,
          );
          lecturesToSave.push(updatedLecture);
          updateCount++;
        } else {
          const newLecture = this.lectureRepository.create(lectureData);
          lecturesToSave.push(newLecture);
          insertCount++;
        }
      }),
    );

    await this.lectureRepository.save(lecturesToSave);
    
    this.logger.log(`[저장 완료] 신규: ${insertCount}, 업데이트: ${updateCount}`);

    return {
      message: '성공',
      totalCount: lecturesToSave.length,
      insertedCount: insertCount,
      updatedCount: updateCount,
    };
  }

  @Get('my')
  @UseGuards(AuthGuard())
  async getMyTimetables(@GetUser() user: User, @Query('year') year: string, @Query('semester') semester: string) {
    const y = parseInt(year) || 2025;
    const s = semester || '1학기';
    return this.timetableService.getMyTimetables(user, y, s);
  }

  @Post('my')
  @UseGuards(AuthGuard())
  async createTimetable(@GetUser() user: User, @Body() body: { name: string; year: number; semester: string }) {
    return this.timetableService.createTimetable(user, body.name, body.year, body.semester);
  }

  @Delete('my/:id')
  @UseGuards(AuthGuard())
  async deleteTimetable(@GetUser() user: User, @Param('id') id: number) {
    return this.timetableService.deleteTimetable(user, id);
  }

  @Post('my/:id/lecture')
  @UseGuards(AuthGuard())
  async addLectureToTimetable(@GetUser() user: User, @Param('id') timetableId: number, @Body('lectureId') lectureId: number) {
    return this.timetableService.addLecture(user, timetableId, lectureId);
  }

  @Post('my/:id/custom-lecture')
  @UseGuards(AuthGuard())
  async addCustomLecture(@GetUser() user: User, @Param('id') timetableId: number, @Body() body: any) {
    return this.timetableService.addCustomLecture(user, timetableId, body);
  }

  @Delete('my/lecture/:id')
  @UseGuards(AuthGuard())
  async deleteLecture(@GetUser() user: User, @Param('id') id: number) {
    return this.timetableService.deleteLecture(user, id);
  }

  @Post('generate')
  @UseGuards(AuthGuard())
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async generateTimetable(@GetUser() user: User, @Body() dto: GenerateTimetableDto) {
    return this.timetableService.generateTimetable(user, dto);
  }
}