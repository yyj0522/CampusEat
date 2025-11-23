import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { Inquiry } from './entities/inquiry.entity';
import { User } from '../users/user.entity';
import { UploadsService } from '../uploads/uploads.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class InquiriesService {
  constructor(
    private readonly uploadsService: UploadsService,
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
  ) {}

  async create(createInquiryDto: CreateInquiryDto, user: User, file?: Express.Multer.File) {
    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileKey: string | null = null;

    if (file) {
      const result = await this.uploadsService.uploadFile('inquiries', file);
      fileUrl = result.url;
      fileKey = result.key;
      fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    }

    const newInquiry = this.inquiryRepository.create({
      ...createInquiryDto,
      author: { id: user.id },
      fileUrl,
      fileName,
      fileKey,
    });
    await this.inquiryRepository.save(newInquiry);
    return newInquiry;
  }

  async findAllForUser(user: User) {
    return this.inquiryRepository.find({
      where: { author: { id: user.id } },
      order: { createdAt: 'DESC' },
      relations: ['answers', 'answers.author'],
    });
  }

  async findAll(page: number, limit: number, status: string) {
    const query = this.inquiryRepository.createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.author', 'author')
      .leftJoinAndSelect('inquiry.answers', 'answers')
      .leftJoinAndSelect('answers.author', 'answerAuthor')
      .orderBy('inquiry.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      query.where('inquiry.status = :status', { status });
    }

    const [inquiries, total] = await query.getManyAndCount();
    
    return {
      data: inquiries,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async updateStatus(id: number, status: string): Promise<Inquiry> {
    const inquiry = await this.inquiryRepository.findOne({ where: { id } });
    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');
    inquiry.status = status;
    await inquiry.save();
    return inquiry;
  }

  async remove(id: number, user: User) {
    const inquiry = await this.inquiryRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!inquiry || inquiry.author.id !== user.id) {
      throw new UnauthorizedException('자신의 문의만 삭제할 수 있습니다.');
    }
    await this.inquiryRepository.delete(id);
  }

  async downloadFile(id: number, user: User): Promise<{ url: string }> {
    const inquiry = await this.inquiryRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!inquiry) throw new NotFoundException('문의 내역을 찾을 수 없습니다.');
    
    const isAdmin = user.role === 'sub_admin' || user.role === 'super_admin';
    if (inquiry.author.id !== user.id && !isAdmin)
      throw new ForbiddenException('해당 파일에 접근할 권한이 없습니다.');
      
    if (!inquiry.fileUrl)
      throw new NotFoundException('첨부파일이 존재하지 않습니다.');

    return { url: inquiry.fileUrl };
  }
}