import { Controller, Post, Body, UseGuards, Get, Patch, Param, Query, UnauthorizedException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { AdminGuard } from '../auth/admin.guard';

@Controller('reports')
@UseGuards(AuthGuard())
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Body() createReportDto: CreateReportDto, @GetUser() user: User) {
    return this.reportsService.create(createReportDto, user);
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status: string,
    @GetUser() user: User
  ) {
    return this.reportsService.findAll(page, limit, status);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @GetUser() user: User
  ) {
    return this.reportsService.updateStatus(+id, status);
  }

  @Post('ban-user')
  @UseGuards(AdminGuard)
  banUser(
    @Body('userId') userId: number,
    @Body('days') days: number,
    @GetUser() admin: User
  ) {
    if (admin.role !== 'super_admin' && admin.id === userId) {
      throw new UnauthorizedException('스스로를 정지시킬 수 없습니다.');
    }
    return this.reportsService.banUser(userId, days);
  }
}