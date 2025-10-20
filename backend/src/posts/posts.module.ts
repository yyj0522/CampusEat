// 파일 경로: src/posts/posts.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';
import { ReportsModule } from '../reports/reports.module';
import { Post } from './entities/post.entity'; // 🚩 추가: Post 엔티티 임포트

@Module({
  imports: [
    // 🚩 핵심: Post 엔티티 리포지토리를 현재 모듈에 등록
    TypeOrmModule.forFeature([Post]), 
    AuthModule, 
    UploadsModule,
    ReportsModule,
  ], 
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}