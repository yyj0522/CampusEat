// src/reports/reports.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report } from './entities/report.entity';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Post } from '../posts/entities/post.entity';
import { Gathering } from '../gatherings/entities/gathering.entity';
// ✅ 1. Repository 주입을 위한 import 추가
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ReportsService {
  // ✅ 2. GatheringRepository를 생성자에 주입
  constructor(
    @InjectRepository(Gathering)
    private gatheringRepository: Repository<Gathering>,
  ) {}

  async createPostReport(postId: number, reason: string, reporter: User): Promise<Report> {
    const reportedPost = await Post.findOne({ where: { id: postId } });
    if (!reportedPost) {
        throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const existingReport = await Report.findOne({ where: { contextType: 'post', contextId: postId.toString(), reporter: { id: reporter.id } } });
    if (existingReport) {
        throw new ConflictException('이미 신고한 게시글입니다.');
    }

    const report = Report.create({
        reason,
        details: reason,
        contextType: 'post',
        contextId: postId.toString(),
        reporter,
    });

    await report.save();
    return report;
  }

  async createGatheringReport(gatheringId: number, reason: string, reporter: User): Promise<Report> {
    // ✅ 3. Active Record 패턴(Gathering.findOne) 대신 주입받은 repository를 사용하도록 변경
    const reportedGathering = await this.gatheringRepository.findOne({ where: { id: gatheringId } });
    if (!reportedGathering) {
        throw new NotFoundException(`Gathering with ID ${gatheringId} not found`);
    }

    const existingReport = await Report.findOne({ where: { contextType: 'gathering', contextId: gatheringId.toString(), reporter: { id: reporter.id } } });
    if (existingReport) {
        throw new ConflictException('이미 신고한 모임입니다.');
    }

    const report = Report.create({
        reason,
        details: reason,
        contextType: 'gathering',
        contextId: gatheringId.toString(),
        reporter,
    });

    await report.save();
    return report;
  }

  async create(createReportDto: CreateReportDto, reporter: User): Promise<Report> {
    const { reportedUserId, reportedRestaurantId, contextType, contextId, ...reportData } = createReportDto;

    const report = Report.create({
      ...reportData,
      contextType,
      contextId,
      reporter,
    });

    if (reportedUserId) {
      const reportedUser = await User.findOne({ where: { id: reportedUserId } });
      if (!reportedUser) throw new NotFoundException(`User with ID ${reportedUserId} not found`);
      report.reportedUser = reportedUser;

      const existingReport = await Report.findOne({ where: { reportedUser: { id: reportedUserId }, reporter: { id: reporter.id }, contextType, contextId } });
      if (existingReport) {
          throw new ConflictException('이미 해당 사용자를 이 건으로 신고했습니다.');
      }
    }

    if (reportedRestaurantId) {
        const reportedRestaurant = await Restaurant.findOne({ where: { id: reportedRestaurantId } });
        if (!reportedRestaurant) throw new NotFoundException(`Restaurant with ID ${reportedRestaurantId} not found`);
        report.reportedRestaurant = reportedRestaurant;
    }

    await report.save();
    return report;
  }

  findAll() { return `This action returns all reports`; }
  findOne(id: number) { return `This action returns a #${id} report`; }
  update(id: number, updateReportDto: UpdateReportDto) { return `This action updates a #${id} report`; }
  remove(id: number) { return `This action removes a #${id} report`; }
}

