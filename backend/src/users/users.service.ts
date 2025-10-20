// 파일 전체 경로: src/users/users.service.ts

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; 
import { Repository } from 'typeorm';
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
    ) {}


    async getMyLikes(user: User): Promise<Like[]> {
        return this.likeRepository.find({
            where: { user: { id: user.id } },
            relations: ['restaurant'], 
            order: { createdAt: 'DESC' },
        });
    }
    // 🌟🌟🌟 추가된 메서드 끝 🌟🌟🌟


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
            user.university = university;
        }

        await user.save();
        return user;
    }

    async changePassword(changePasswordDto: ChangePasswordDto, user: User): Promise<void> {
        const { currentPassword, newPassword } = changePasswordDto;

        // DB에 저장된 user.password는 select: false 옵션 때문에 기본적으로 로드되지 않음
        // 따라서 비밀번호를 포함하여 user 정보를 다시 조회해야 함
        const userWithPassword = await User.createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.id = :id', { id: user.id })
            .getOne();

        if (!userWithPassword) {
            throw new UnauthorizedException('User not found.');
        }

        const isMatch = await bcrypt.compare(currentPassword, userWithPassword.password);
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
}