// 파일 전체 경로: src/uploads/uploads.module.ts

import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService], // 1. UploadsService를 export합니다.
})
export class UploadsModule {}