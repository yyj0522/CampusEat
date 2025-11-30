import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { CampusStatusService } from './campus-status.service';
import { CreateCampusStatusDto } from './dto/create-campus-status.dto';

@Controller('campus/status')
@UseGuards(AuthGuard())
export class CampusStatusController {
  constructor(private readonly campusStatusService: CampusStatusService) {}

  @Post()
  create(@Body() createCampusStatusDto: CreateCampusStatusDto, @GetUser() user: User) {
    return this.campusStatusService.createReport(createCampusStatusDto, user);
  }

  @Get('summary/latest')
  getLatestSummary(@GetUser() user: User) {
    return this.campusStatusService.getLatestSummary(user);
  }

  @Get('prediction')
  getPrediction(@Query('day') day: string, @GetUser() user: User) {
    return this.campusStatusService.getPrediction(user, day);
  }
}