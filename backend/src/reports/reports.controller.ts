// 파일 전체 경로: src/reports/reports.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';

@Controller('reports')
@UseGuards(AuthGuard())
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Body() createReportDto: CreateReportDto, @GetUser() user: User) {
    return this.reportsService.create(createReportDto, user);
  }
}