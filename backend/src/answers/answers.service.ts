import { Injectable, NotFoundException } from '@nestjs/common';
import { Answer } from './entities/answer.entity';
import { Inquiry } from '../inquiries/entities/inquiry.entity';
import { User } from '../users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AnswersService {
  constructor(
      @InjectRepository(Answer)
      private answerRepository: Repository<Answer>,
      @InjectRepository(Inquiry)
      private inquiryRepository: Repository<Inquiry>,
  ) {}

  async findAllForInquiry(inquiryId: number): Promise<Answer[]> {
    return this.answerRepository.find({
      where: { inquiry: { id: inquiryId } },
      order: { createdAt: 'ASC' },
      relations: ['author'],
    });
  }

  async create(inquiryId: number, content: string, adminUser: User): Promise<Answer> {
      const inquiry = await this.inquiryRepository.findOne({ where: { id: inquiryId } });
      if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');

      const answer = this.answerRepository.create({
          content,
          inquiry,
          author: adminUser
      });
      
      await this.answerRepository.save(answer);

      inquiry.status = 'answered';
      await this.inquiryRepository.save(inquiry);

      return answer;
  }
}