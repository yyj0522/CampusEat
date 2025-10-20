// File Path: src/universities/universities.controller.ts

import { Controller, Get } from '@nestjs/common';

@Controller('universities')
export class UniversitiesController {
  @Get()
  findAll() {
    // For now, we'll hardcode the list.
    // Later, this can be changed to fetch from a database.
    return [
      "서울대학교(본교)",
      "연세대학교(본교)",
      "고려대학교(본교)",
      "신구대학교(본교)",
      "백석대학교(본교)",
      "백석문화대학교(본교)",
    ];
  }
}