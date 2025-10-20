// 파일 경로: src/users/users.module.ts

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { User } from './user.entity'; 
import { Like } from '../restaurants/entities/like.entity';
import { Review } from '../reviews/entities/review.entity'; 
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
   imports: [
      TypeOrmModule.forFeature([User, Like, Review]), 
      AuthModule, ReviewsModule
   ],
   controllers: [UsersController],
   providers: [UsersService],
  exports: [UsersService] 
})
export class UsersModule {}