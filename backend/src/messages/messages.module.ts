// 파일 전체 경로: src/messages/messages.module.ts

import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    AuthModule, // AuthGuard 사용을 위해 AuthModule을 임포트합니다.
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}