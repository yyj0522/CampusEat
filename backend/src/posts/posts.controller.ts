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
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';

@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(AuthGuard())
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createPostDto: CreatePostDto,
    @GetUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.postsService.create(createPostDto, user, file);
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get('slideshow')
  findSlideshowPosts() {
    return this.postsService.findSlideshowPosts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id, true);
  }

  @Patch(':id')
  @UseGuards(AuthGuard())
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto, 
    @GetUser() user: User,
  ) {
    this.logger.log(`Updating post with id: ${id}`);
    return this.postsService.update(+id, updatePostDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard())
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.postsService.remove(+id, user);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard())
  likePost(@Param('id') id: string, @GetUser() user: User) {
    return this.postsService.likePost(+id, user);
  }

  @Post(':id/report')
  @UseGuards(AuthGuard())
  reportPost(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @GetUser() user: User,
  ) {
    return this.postsService.reportPost(+id, reason, user);
  }
}