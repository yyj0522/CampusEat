// 파일 전체 경로: src/shuttles/shuttles.service.ts

import { Injectable } from '@nestjs/common';
import { Shuttle } from './entities/shuttle.entity';

@Injectable()
export class ShuttlesService {
  findAllByUniversity(universityName: string) {
    return Shuttle.find({ where: { universityName } });
  }
}