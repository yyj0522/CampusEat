import { Controller, Get, Param, UseGuards, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { AdminGuard } from '../auth/admin.guard';

@Controller('inquiries/:inquiryId/answers') 
@UseGuards(AuthGuard())
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Get()
  findAllForInquiry(@Param('inquiryId') inquiryId: string) {
    return this.answersService.findAllForInquiry(+inquiryId);
  }

  @Post()
  @UseGuards(AdminGuard)
  create(
      @Param('inquiryId') inquiryId: string,
      @Body('content') content: string,
      @GetUser() user: User
  ) {
      return this.answersService.create(+inquiryId, content, user);
  }
}