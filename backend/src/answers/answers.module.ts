import { Module } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { AnswersController } from './answers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Answer } from './entities/answer.entity';
import { Inquiry } from '../inquiries/entities/inquiry.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Answer, Inquiry]),
    AuthModule,
  ],
  controllers: [AnswersController],
  providers: [AnswersService],
})
export class AnswersModule {}