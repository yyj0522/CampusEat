// 파일 전체 경로: src/answers/answers.module.ts

import { Module } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { AnswersController } from './answers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Answer } from './entities/answer.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Answer]),
    AuthModule, // 👈 AuthGuard 사용을 위해 이 줄을 추가합니다.
  ],
  controllers: [AnswersController],
  providers: [AnswersService],
})
export class AnswersModule {}