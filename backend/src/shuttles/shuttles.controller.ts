// 파일 전체 경로: src/shuttles/shuttles.controller.ts

import { Controller, Get, Param } from '@nestjs/common';
import { ShuttlesService } from './shuttles.service';

@Controller('shuttles')
export class ShuttlesController {
  constructor(private readonly shuttlesService: ShuttlesService) {}

  @Get(':universityName') // 예: /shuttles/백석대학교(본교)
  findAllByUniversity(@Param('universityName') universityName: string) {
    return this.shuttlesService.findAllByUniversity(universityName);
  }
}