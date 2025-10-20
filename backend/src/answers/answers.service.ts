// 파일 전체 경로: src/answers/answers.service.ts
import { Injectable } from '@nestjs/common';
import { Answer } from './entities/answer.entity';

@Injectable()
export class AnswersService {
  async findAllForInquiry(inquiryId: number): Promise<Answer[]> {
    return Answer.find({
      where: { inquiry: { id: inquiryId } },
      order: { createdAt: 'ASC' },
    });
  }
}