// src/inquiries/inquiries.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';

@Controller('inquiries')
@UseGuards(AuthGuard())
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() body: any,
    @GetUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.inquiriesService.create(body, user, file);
  }

  @Get()
  findAllForUser(@GetUser() user: User) {
    return this.inquiriesService.findAllForUser(user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.inquiriesService.remove(+id, user);
  }

  // ✅ 변경된 다운로드 엔드포인트
  @Get(':id/file')
  async getDownloadUrl(@Param('id') id: string, @GetUser() user: User) {
    return this.inquiriesService.downloadFile(+id, user);
  }
}
