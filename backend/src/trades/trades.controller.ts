import {
  Controller, Get, Post, Body, Param,
  Delete, UseGuards, Query,
} from '@nestjs/common';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';

import { KickUserDto } from '../gatherings/dto/kick-user.dto';

@Controller('trades')
@UseGuards(AuthGuard())
export class TradesController {
  constructor(
    private readonly tradesService: TradesService,
  ) {}

  @Post()
  create(@Body() createTradeDto: CreateTradeDto, @GetUser() user: User) {
    return this.tradesService.create(createTradeDto, user);
  }

  @Get()
  findAll(@Query('search') search: string = "", @GetUser() user: User) {
    return this.tradesService.findAll(user.university, search);
  }

  @Get('my')
  findMyTrades(@GetUser() user: User) {
    return this.tradesService.findMyTrades(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tradesService.findOne(+id);
  }

  @Get(':id/messages')
  findMessages(@Param('id') id: string, @GetUser() user: User) {
    return this.tradesService.findMessagesForTrade(+id, user);
  }

  @Post(':id/complete')
  completeTrade(@Param('id') id: string, @GetUser() user: User) {
    return this.tradesService.completeTrade(+id, user);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @GetUser() user: User) {
    return this.tradesService.join(+id, user);
  }

  @Post(':id/leave')
  leave(@Param('id') id: string, @GetUser() user: User) {
    return this.tradesService.leave(+id, user);
  }

  @Post(':id/kick')
  kick(@Param('id') id: string, @Body() kickUserDto: KickUserDto, @GetUser() user: User) {
    return this.tradesService.kick(+id, kickUserDto.userId, user.id);
  }
}