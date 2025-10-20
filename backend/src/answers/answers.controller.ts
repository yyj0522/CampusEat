// 파일 전체 경로: src/answers/answers.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('inquiries/:inquiryId/answers') // 경로를 inquiries에 종속시킴
@UseGuards(AuthGuard())
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Get()
  findAllForInquiry(@Param('inquiryId') inquiryId: string) {
    return this.answersService.findAllForInquiry(+inquiryId);
  }
}