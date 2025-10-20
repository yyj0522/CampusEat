// 파일 경로: src/uploads/uploads.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file')) // 'file'이라는 키로 들어온 파일을 받음
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const uploadedFile = await this.uploadsService.uploadFileToS3('posts', file);
    const fileUrl = this.uploadsService.getAwsS3FileUrl(uploadedFile.key);
    return { imageUrl: fileUrl };
  }
}