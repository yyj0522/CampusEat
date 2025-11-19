import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';
import { ReportsModule } from '../reports/reports.module';
import { Post } from './entities/post.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]), 
    AuthModule, 
    UploadsModule,
    ReportsModule,
  ], 
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}