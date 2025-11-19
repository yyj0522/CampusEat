import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from './user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Like } from '../restaurants/entities/like.entity';
import { Review } from '../reviews/entities/review.entity';

import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getMyLikes(user: User): Promise<Like[]> {
    return this.likeRepository.find({
      where: { user: { id: user.id } },
      relations: ['restaurant'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateUser(updateUserDto: UpdateUserDto, user: User): Promise<User> {
    const { nickname, university } = updateUserDto;

    if (nickname) {
      if (nickname !== user.nickname) {
        const existingNickname = await User.findOne({ where: { nickname } });
        if (existingNickname) {
          throw new ConflictException('이미 사용 중인 닉네임입니다.');
        }
      }
      user.nickname = nickname;
      user.lastNicknameChange = new Date();
    }

    if (university) {
      if (
        user.role === 'sub_admin' ||
        user.role === 'super_admin'
      ) {
        user.university = university;
      }
    }

    await user.save();
    return user;
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
    user: User,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const userWithPassword = await User.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: user.id })
      .getOne();

    if (!userWithPassword) {
      throw new UnauthorizedException('User not found.');
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      userWithPassword.password,
    );
    if (!isMatch) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
  }

  async deleteAccount(user: User): Promise<void> {
    await user.remove();
  }

  async getMyPosts(user: User): Promise<Post[]> {
    return Post.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async getMyComments(user: User): Promise<Comment[]> {
    return Comment.find({
      where: { user: { id: user.id } },
      relations: ['post'],
      order: { createdAt: 'DESC' },
    });
  }

  async getMyReviews(user: User) {
    return this.reviewRepository.find({
      where: { author: { id: user.id } },
      order: { createdAt: 'DESC' },
      relations: ['restaurant'],
    });
  }

  async suspendUser(userId: number, days: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    user.status = '정지';

    if (days === -1) {
      user.suspensionEndDate = null;
    } else {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      user.suspensionEndDate = endDate;
    }
    
    return this.userRepository.save(user);
  }
  
  async unsuspendUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }
    
    user.status = '활성';
    user.suspensionEndDate = null;
    return this.userRepository.save(user);
  }

  async findAll(page: number, limit: number, status: string) {
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.status = :status', { status })
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await query.getManyAndCount();
    
    return {
        data: users,
        meta: {
            total,
            page,
            lastPage: Math.ceil(total / limit),
        }
    };
  }
}