import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { User } from '../users/user.entity';
import { UploadsService } from '../uploads/uploads.service';
import { ReportsService } from '../reports/reports.service';
import { Report } from '../reports/entities/report.entity';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private readonly uploadsService: UploadsService,
    private readonly reportsService: ReportsService,
  ) {}

  async create(
    createPostDto: CreatePostDto,
    user: User,
    file?: Express.Multer.File,
  ): Promise<Post> {
    const {
      title,
      content,
      category,
      isAnonymous,
      slideImage,
      slideCaption,
      slideCaptionSmall,
      slideBackgroundColor, 
      authorDisplayName,
    } = createPostDto;
    let imageUrl: string | undefined = undefined;

    if (file) {
      const uploadedFile = await this.uploadsService.uploadFileToS3(
        'posts',
        file,
      );
      imageUrl = this.uploadsService.getAwsS3FileUrl(uploadedFile.key);
    }

    const post = this.postRepository.create({
      title,
      content,
      category,
      isAnonymous: isAnonymous,
      user,
      imageUrl,
      slideImage,
      slideCaption,
      slideCaptionSmall,
      slideBackgroundColor, 
      authorDisplayName,
    });

    await this.postRepository.save(post);
    return post;
  }

  async findAll(): Promise<Post[]> {
    try {
      const posts = await this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user')
        .leftJoinAndSelect('post.likedByUsers', 'likedByUsers')
        .loadRelationCountAndMap('post.commentCount', 'post.comments')
        .orderBy('post.createdAt', 'DESC')
        .getMany();
      return posts;
    } catch (error) {
      this.logger.error(
        '게시글 목록 조회(findAll) 중 SQL 쿼리 오류 발생:',
        error.stack,
      );
      throw new InternalServerErrorException(
        '게시글 목록을 불러오는 중 서버 오류가 발생했습니다.',
      );
    }
  }

  async findOne(id: number, incrementView = false): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user', 'likedByUsers'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    if (incrementView) {
      post.views = (post.views || 0) + 1;
      await this.postRepository.save(post);
    }

    return post;
  }

  async update(
    id: number,
    updatePostDto: UpdatePostDto,
    user: User,
  ): Promise<Post> {
    const post = await this.findOne(id);

    if (post.user.id !== user.id) {
      throw new UnauthorizedException(`You can only update your own posts`);
    }

    Object.assign(post, updatePostDto);

    try {
      await this.postRepository.save(post);
      return this.findOne(id);
    } catch (error) {
      this.logger.error(`게시글(id: ${id}) 수정 중 오류 발생:`, error.stack);
      throw new InternalServerErrorException(
        '게시글 수정 중 서버 오류가 발생했습니다.',
      );
    }
  }

  async remove(id: number, user: User): Promise<void> {
    const post = await this.findOne(id);
    
    const isAdmin = user.role === 'sub_admin' || user.role === 'super_admin';

    if (post.user.id !== user.id && !isAdmin) {
      throw new UnauthorizedException(`You can only delete your own posts`);
    }
    await this.postRepository.remove(post);
  }

  async likePost(postId: number, user: User): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['likedByUsers'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    const isAlreadyLiked = post.likedByUsers.some(
      (likedUser) => likedUser.id === user.id,
    );

    if (isAlreadyLiked) {
      post.likedByUsers = post.likedByUsers.filter(
        (likedUser) => likedUser.id !== user.id,
      );
    } else {
      post.likedByUsers.push(user);
    }

    post.likeCount = post.likedByUsers.length;
    return this.postRepository.save(post);
  }

  async reportPost(
    postId: number,
    reason: string,
    user: User,
  ): Promise<Report> {
    if (!reason || reason.trim() === '') {
      throw new BadRequestException('신고 사유를 입력해야 합니다.');
    }
    await this.findOne(postId);

    const existingReport = await Report.findOne({
      where: {
        reporter: { id: user.id },
        contextType: 'post',
        contextId: postId.toString(),
      },
    });

    if (existingReport) {
      throw new ConflictException('이미 신고한 게시글입니다.');
    }

    return this.reportsService.createPostReport(postId, reason, user);
  }

  async findSlideshowPosts(): Promise<Post[]> {
    try {
      const posts = await this.postRepository.find({
        where: {
          category: 'notice',
          slideImage: Not(IsNull()),
        },
        order: {
          createdAt: 'DESC',
        },
        take: 5,
      });
      return posts;
    } catch (error) {
      this.logger.error(
        '슬라이드쇼 게시글 조회 중 오류 발생:',
        error.stack,
      );
      throw new InternalServerErrorException(
        '슬라이드쇼 게시글을 불러오는 중 서버 오류가 발생했습니다.',
      );
    }
  }
}