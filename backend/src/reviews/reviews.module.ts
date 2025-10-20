import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';
import { Submission } from '../submissions/entities/submission.entity';
import { Report } from '../reports/entities/report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Submission, Report]),
    AuthModule,
    UploadsModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService, TypeOrmModule],
})
export class ReviewsModule {}