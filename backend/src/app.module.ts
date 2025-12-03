import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from './users/user.entity';
import { Post } from './posts/entities/post.entity';
import { Comment } from './comments/entities/comment.entity';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { UsersModule } from './users/users.module';
import { UploadsModule } from './uploads/uploads.module';
import { UniversitiesModule } from './universities/universities.module';
import { University } from './universities/entities/university.entity';
import { InquiriesModule } from './inquiries/inquiries.module';
import { Inquiry } from './inquiries/entities/inquiry.entity';
import { AnswersModule } from './answers/answers.module';
import { Answer } from './answers/entities/answer.entity';
import { ReportsModule } from './reports/reports.module';
import { Report } from './reports/entities/report.entity';
import { MessagesModule } from './messages/messages.module';
import { Message } from './messages/entities/message.entity';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { Restaurant } from './restaurants/entities/restaurant.entity';
import { ReviewsModule } from './reviews/reviews.module';
import { Review } from './reviews/entities/review.entity';
import { SubmissionsModule } from './submissions/submissions.module';
import { Submission } from './submissions/entities/submission.entity';
import { Like } from './restaurants/entities/like.entity';
import { GatheringsModule } from './gatherings/gatherings.module';
import { Gathering } from './gatherings/entities/gathering.entity';
import { GatheringParticipant } from './gatherings/entities/gathering-participant.entity';
import { GatheringMessage } from './gatherings/entities/gathering-message.entity';
import { TasksModule } from './tasks/tasks.module';
import { TimetableModule } from './timetable/timetable.module';
import { Lecture } from './timetable/lecture.entity';
import { Timetable } from './timetable/timetable.entity';
import { TimetableLecture } from './timetable/timetable-lecture.entity';
import { LectureReview } from './timetable/lecture-review.entity';
import { TradesModule } from './trades/trades.module';
import { Trade } from './trades/entities/trade.entity';
import { TradeParticipant } from './trades/entities/trade-participant.entity';
import { TradeMessage } from './trades/entities/trade-message.entity';
import { Book } from './trades/entities/book.entity';
import { CampusStatusModule } from './campus-status/campus-status.module';
import { CampusStatusMessage } from './campus-status/entities/campus-status-message.entity';
import { CampusStatusSummary } from './campus-status/entities/campus-status-summary.entity';
import { CampusPrediction } from './campus-status/entities/campus-prediction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production'
                      ? '.env.production'
                      : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [
          User,
          Post,
          Comment,
          Inquiry,
          Answer,
          Report,
          Message,
          Restaurant,
          Review,
          Submission,
          University,
          Like,
          Gathering,
          GatheringParticipant,
          GatheringMessage,
          Lecture,
          Timetable,
          TimetableLecture,
          LectureReview,
          Trade,
          TradeParticipant,
          TradeMessage,
          Book,
          CampusStatusMessage,
          CampusStatusSummary,
          CampusPrediction,
        ],
        synchronize: true,
      }),
    }),
    
    ScheduleModule.forRoot(),
    TasksModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    UsersModule,
    UploadsModule,
    UniversitiesModule,
    InquiriesModule,
    AnswersModule,
    ReportsModule,
    MessagesModule,
    RestaurantsModule,
    ReviewsModule,
    SubmissionsModule,
    GatheringsModule,
    TimetableModule,
    TradesModule,
    CampusStatusModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}