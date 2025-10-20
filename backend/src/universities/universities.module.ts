// 파일 전체 경로: src/universities/universities.module.ts

import { Module } from '@nestjs/common';
import { UniversitiesController } from './universities.controller';
import { University } from './entities/university.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([University])], // 이 줄을 추가합니다!
  controllers: [UniversitiesController],
  providers: [], // UniversitiesService가 없으므로 비워둡니다.
})
export class UniversitiesModule {}