import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';

@Controller('restaurants/:restaurantId/reviews')
@UseGuards(AuthGuard())
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Param('restaurantId') restaurantId: string,
    @Body() createReviewDto: CreateReviewDto,
    @GetUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.reviewsService.create(+restaurantId, createReviewDto, user, file);
  }

  @Get()
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.reviewsService.findAllByRestaurant(+restaurantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(+id);
  }

  // ✅ 실제 서비스의 update() 연결
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @GetUser() user: User,
  ) {
    return this.reviewsService.update(+id, updateReviewDto, user);
  }

  // ✅ 실제 서비스의 remove() 연결
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.reviewsService.remove(+id, user);
  }
}
