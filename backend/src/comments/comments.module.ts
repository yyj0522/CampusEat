// 파일 경로: src/comments/comments.module.ts
import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { AuthModule } from '../auth/auth.module'; // AuthModule 임포트

@Module({
  imports: [AuthModule], // 여기에 AuthModule 추가
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}