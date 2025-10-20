// src/inquiries/inquiries.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InquiriesService } from './inquiries.service';
import { InquiriesController } from './inquiries.controller';
import { Inquiry } from './entities/inquiry.entity';
import { UploadsModule } from '../uploads/uploads.module';
import { PassportModule } from '@nestjs/passport'; // 👈 추가

@Module({
  imports: [
    TypeOrmModule.forFeature([Inquiry]),
    UploadsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }), // 👈 추가
  ],
  controllers: [InquiriesController],
  providers: [InquiriesService],
  exports: [InquiriesService],
})
export class InquiriesModule {}
