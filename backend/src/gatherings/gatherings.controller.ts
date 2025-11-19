import {
  Controller, Get, Post, Body, Param,
  Delete, UseGuards, Query, BadRequestException,
} from '@nestjs/common';
import { GatheringsService } from './gatherings.service';
import { CreateGatheringDto } from './dto/create-gathering.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { GatheringType } from './entities/gathering.entity';
import { KickUserDto } from './dto/kick-user.dto';
import { ReportsService } from '../reports/reports.service';
import { CreateReportDto } from '../reports/dto/create-report.dto';


@Controller('gatherings')
@UseGuards(AuthGuard())
export class GatheringsController {
  constructor(
    private readonly gatheringsService: GatheringsService,
    private readonly reportsService: ReportsService,
  ) {}

  @Post()
  create(@Body() createGatheringDto: CreateGatheringDto, @GetUser() user: User) {
    return this.gatheringsService.create(createGatheringDto, user);
  }

  @Post(':id/report')
  reportGathering(
    @Param('id') id: string,
    @Body() createReportDto: CreateReportDto,
    @GetUser() user: User,
  ) {
    return this.reportsService.createGatheringReport(+id, createReportDto.reason, user);
  }
  
  @Post(':id/acknowledge-kick')
  acknowledgeKick(@Param('id') id: string, @GetUser() user: User) {
    return this.gatheringsService.acknowledgeKick(+id, user);
  }

  @Get()
  findAll(@Query('type') type: string, @GetUser() user: User) {
    if (type === 'myMeetings') {
      return this.gatheringsService.findMyGatherings(user);
    }
    if (type !== GatheringType.MEETING && type !== GatheringType.CARPOOL) {
        throw new BadRequestException('유효하지 않은 모임 타입입니다.');
    }
    if (!user.university) {
      throw new BadRequestException('사용자에게 대학교 정보가 없습니다.');
    }
    return this.gatheringsService.findAll(user.university, type as GatheringType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gatheringsService.findOne(+id);
  }

  @Get(':id/messages')
  findMessages(@Param('id') id: string, @GetUser() user: User) {
    return this.gatheringsService.findMessagesForGathering(+id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.gatheringsService.remove(+id, user);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @GetUser() user: User) {
    return this.gatheringsService.join(+id, user);
  }

  @Post(':id/leave')
  leave(@Param('id') id: string, @GetUser() user: User) {
    return this.gatheringsService.leave(+id, user);
  }

  @Post(':id/kick')
  kick(@Param('id') id: string, @Body() kickUserDto: KickUserDto, @GetUser() user: User) {
    return this.gatheringsService.kick(+id, kickUserDto.userId, user.id);
  }
}
