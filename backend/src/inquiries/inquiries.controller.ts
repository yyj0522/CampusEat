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
  Query,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InquiriesService } from './inquiries.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { AdminGuard } from '../auth/admin.guard';

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

  @Get('admin')
  @UseGuards(AdminGuard)
  findAll(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('status') status: string,
      @GetUser() user: User
  ) {
      return this.inquiriesService.findAll(page, limit, status);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  updateStatus(
      @Param('id') id: string,
      @Body('status') status: string,
      @GetUser() user: User
  ) {
      return this.inquiriesService.updateStatus(+id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.inquiriesService.remove(+id, user);
  }

  @Get(':id/file')
  async getDownloadUrl(@Param('id') id: string, @GetUser() user: User) {
    return this.inquiriesService.downloadFile(+id, user);
  }
}