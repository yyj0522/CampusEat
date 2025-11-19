import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { Report } from './entities/report.entity';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Post } from '../posts/entities/post.entity';
import { Gathering } from '../gatherings/entities/gathering.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(Gathering)
    private gatheringRepository: Repository<Gathering>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    private usersService: UsersService,
  ) {}

  async createPostReport(postId: number, reason: string, reporter: User): Promise<Report> {
    const reportedPost = await this.postRepository.findOne({ 
        where: { id: postId }, 
        relations: ['user'] 
    });
    if (!reportedPost) {
        throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const existingReport = await this.reportRepository.findOne({ where: { contextType: 'post', contextId: postId.toString(), reporter: { id: reporter.id } } });
    if (existingReport) {
        throw new ConflictException('이미 신고한 게시글입니다.');
    }

    const report = this.reportRepository.create({
        reason,
        details: reason,
        contextType: 'post',
        contextId: postId.toString(),
        reporter,
        reportedUser: reportedPost.user 
    });

    await this.reportRepository.save(report);
    return report;
  }

  async createGatheringReport(gatheringId: number, reason: string, reporter: User): Promise<Report> {
    const reportedGathering = await this.gatheringRepository.findOne({ 
        where: { id: gatheringId }, 
        relations: ['creator'] 
    });
    if (!reportedGathering) {
        throw new NotFoundException(`Gathering with ID ${gatheringId} not found`);
    }

    const existingReport = await this.reportRepository.findOne({ where: { contextType: 'gathering', contextId: gatheringId.toString(), reporter: { id: reporter.id } } });
    if (existingReport) {
        throw new ConflictException('이미 신고한 모임입니다.');
    }

    const report = this.reportRepository.create({
        reason,
        details: reason,
        contextType: 'gathering',
        contextId: gatheringId.toString(),
        reporter,
        reportedUser: reportedGathering.creator 
    });

    await this.reportRepository.save(report);
    return report;
  }

  async create(createReportDto: CreateReportDto, reporter: User): Promise<Report> {
    const { reportedUserId, reportedRestaurantId, contextType, contextId, ...reportData } = createReportDto;

    const report = this.reportRepository.create({
      ...reportData,
      contextType,
      contextId,
      reporter,
    });

    if (reportedUserId) {
      const reportedUser = await User.findOne({ where: { id: reportedUserId } });
      if (!reportedUser) throw new NotFoundException(`User with ID ${reportedUserId} not found`);
      report.reportedUser = reportedUser;

      const existingReport = await this.reportRepository.findOne({ where: { reportedUser: { id: reportedUserId }, reporter: { id: reporter.id }, contextType, contextId } });
      if (existingReport) {
          throw new ConflictException('이미 해당 사용자를 이 건으로 신고했습니다.');
      }
    }

    if (reportedRestaurantId) {
        const reportedRestaurant = await this.restaurantRepository.findOne({ where: { id: reportedRestaurantId } });
        if (!reportedRestaurant) throw new NotFoundException(`Restaurant with ID ${reportedRestaurantId} not found`);
        report.reportedRestaurant = reportedRestaurant;
    }

    await this.reportRepository.save(report);
    return report;
  }

  async findAll(page: number, limit: number, status: string) {
      const query = this.reportRepository.createQueryBuilder('report')
        .leftJoinAndSelect('report.reporter', 'reporter')
        .leftJoinAndSelect('report.reportedUser', 'reportedUser')
        .leftJoinAndSelect('report.reportedRestaurant', 'reportedRestaurant')
        .orderBy('report.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      if (status) {
          query.where('report.status = :status', { status });
      }

      const [reports, total] = await query.getManyAndCount();
      
      return {
          data: reports,
          meta: {
              total,
              page,
              lastPage: Math.ceil(total / limit),
          }
      };
  }
  
  async updateStatus(id: number, status: string): Promise<Report> {
      const report = await this.reportRepository.findOne({ where: { id } });
      if (!report) throw new NotFoundException('신고 내역을 찾을 수 없습니다.');
      
      report.status = status;
      await this.reportRepository.save(report);
      return report;
  }

  async banUser(userId: number, days: number) {
      return this.usersService.suspendUser(userId, days);
  }
}