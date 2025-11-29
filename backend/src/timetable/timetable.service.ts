import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Timetable } from './timetable.entity';
import { TimetableLecture } from './timetable-lecture.entity';
import { Lecture } from './lecture.entity';
import { LectureReview } from './lecture-review.entity';
import { User } from '../users/user.entity';
import { RedisManagerService } from '../common/redis/redis-manager.service';

@Injectable()
export class TimetableService {
  private readonly logger = new Logger(TimetableService.name);

  constructor(
    @InjectRepository(Timetable)
    private timetableRepository: Repository<Timetable>,
    @InjectRepository(TimetableLecture)
    private timetableLectureRepository: Repository<TimetableLecture>,
    @InjectRepository(Lecture)
    private lectureRepository: Repository<Lecture>,
    @InjectRepository(LectureReview)
    private reviewRepository: Repository<LectureReview>,
    private readonly redisManager: RedisManagerService,
  ) {}

  async getMyTimetables(user: User, year: number, semester: string) {
    return this.timetableRepository.find({
      where: { user: { id: user.id }, year, semester },
      relations: ['lectures'],
      order: { id: 'ASC' },
    });
  }

  async createTimetable(user: User, name: string, year: number, semester: string) {
    const timetable = this.timetableRepository.create({
      user,
      name,
      year,
      semester,
    });
    return this.timetableRepository.save(timetable);
  }

  async deleteTimetable(user: User, id: number) {
    const timetable = await this.timetableRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['lectures'],
    });

    if (!timetable) {
      throw new NotFoundException('시간표를 찾을 수 없습니다.');
    }

    const lectureIds = timetable.lectures
      .filter(l => l.lectureId)
      .map(l => l.lectureId);

    await this.timetableRepository.remove(timetable);

    for (const lectureId of lectureIds) {
      const count = await this.timetableLectureRepository.count({
        where: {
          timetable: { user: { id: user.id } },
          lectureId,
        },
      });

      if (count === 0) {
        await this.redisManager.removeUserFromLecture(lectureId, user.id);
      }
    }

    return { message: '삭제되었습니다.' };
  }

  async addLecture(user: User, timetableId: number, lectureId: number) {
    const timetable = await this.timetableRepository.findOne({ 
      where: { id: timetableId, user: { id: user.id } } 
    });
    if (!timetable) throw new NotFoundException('시간표를 찾을 수 없습니다.');

    const lecture = await this.lectureRepository.findOne({ where: { id: lectureId } });
    if (!lecture) throw new NotFoundException('강의 정보를 찾을 수 없습니다.');

    // DB에서 가져온 값이 있으면 쓰고, 없으면 0 (안전장치)
    const credits = lecture.credits !== undefined ? Number(lecture.credits) : 0;

    const newLecture = this.timetableLectureRepository.create({
      timetable,
      lectureId: lecture.id,
      courseName: lecture.courseName,
      professor: lecture.professor,
      courseCode: lecture.courseCode,
      credits: credits, 
      schedule: JSON.parse(JSON.stringify(lecture.schedule)), 
      color: this.getRandomColor(),
    });

    const savedLecture = await this.timetableLectureRepository.save(newLecture);

    await this.redisManager.addUserToLecture(lecture.id, user.id);

    return savedLecture;
  }

  async addCustomLecture(user: User, timetableId: number, data: any) {
    const timetable = await this.timetableRepository.findOne({ 
        where: { id: timetableId, user: { id: user.id } } 
    });
    if (!timetable) throw new NotFoundException('시간표를 찾을 수 없습니다.');

    const credits = data.credits !== undefined ? Number(data.credits) : 0;

    const newLecture = this.timetableLectureRepository.create({
      timetable,
      lectureId: null,
      courseName: data.courseName,
      professor: data.professor,
      courseCode: 'CUSTOM',
      credits: credits,
      schedule: data.schedule,
      color: this.getRandomColor(),
    });

    return this.timetableLectureRepository.save(newLecture);
  }
  
  async deleteLecture(user: User, lectureId: number) {
    const timetableLecture = await this.timetableLectureRepository.findOne({
        where: { id: lectureId },
        relations: ['timetable', 'timetable.user']
    });
    
    if (!timetableLecture || timetableLecture.timetable.user.id !== user.id) {
        throw new NotFoundException('강의를 찾을 수 없거나 권한이 없습니다.');
    }

    const originalLectureId = timetableLecture.lectureId;

    await this.timetableLectureRepository.remove(timetableLecture);

    if (originalLectureId) {
      const count = await this.timetableLectureRepository.count({
        where: {
          timetable: { user: { id: user.id } },
          lectureId: originalLectureId,
        },
      });

      if (count === 0) {
        await this.redisManager.removeUserFromLecture(originalLectureId, user.id);
      }
    }

    return { message: '삭제되었습니다.' };
  }

  async getLectureStats(lectureIds: number[]) {
    // [🔥🔥🔥 진단 코드 시작]
    // 강의 검색시 이 함수가 호출됩니다. 이때 실제 DB에 어떤 컬럼들이 있는지 날것 그대로 찍어봅니다.
    if (lectureIds.length > 0) {
        try {
            // Raw Query를 통해 엔티티 매핑을 거치지 않은 순수 DB 데이터를 조회합니다.
            const rawData = await this.lectureRepository.query(
                `SELECT * FROM lectures WHERE id = ${lectureIds[0]}`
            );
            console.log('==================================================');
            console.log('🔥 [DB 원본 데이터 확인 - 범인을 찾아라] 🔥');
            console.log('검색된 강의 ID:', lectureIds[0]);
            console.log('DB에서 가져온 실제 행 데이터:', rawData[0]);
            console.log('==================================================');
        } catch (e) {
            console.error('진단 로그 출력 실패:', e);
        }
    }
    // [🔥🔥🔥 진단 코드 끝]

    const counts = await this.redisManager.getMultipleLectureCounts(lectureIds);
    
    const lectures = await this.lectureRepository.find({
      where: { id: In(lectureIds) },
      select: ['id', 'capacity']
    });

    return counts.map(c => {
      const lecture = lectures.find(l => l.id === c.id);
      const capacity = lecture ? lecture.capacity : 0;
      const competitionRate = capacity > 0 ? (c.count / capacity).toFixed(2) : '0.00';
      
      return {
        id: c.id,
        savedCount: c.count,
        capacity,
        competitionRate
      };
    });
  }

  async createReview(user: User, lectureId: number, content: string, rating: number, year: number, semester: string, isAnonymous: boolean) {
    const review = this.reviewRepository.create({
      user,
      lectureId,
      content,
      rating,
      year,
      semester,
      isAnonymous,
    });
    return this.reviewRepository.save(review);
  }

  async getReviews(lectureId: number, currentUser: User) {
    const reviews = await this.reviewRepository.find({
      where: { lectureId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    const kstFormatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return reviews.map(review => {
      const dateObj = new Date(review.createdAt);
      
      const parts = kstFormatter.formatToParts(dateObj);
      const getPart = (type: string) => parts.find(p => p.type === type)?.value;
      
      const formattedDate = `${getPart('year')}.${getPart('month')}.${getPart('day')} ${getPart('hour')}:${getPart('minute')}`;

      return {
        id: review.id,
        content: review.content,
        rating: review.rating,
        year: review.year,
        semester: review.semester,
        createdAt: formattedDate, 
        isMine: review.userId === currentUser.id,
        writer: review.isAnonymous ? '익명' : review.user.nickname,
      };
    });
  }

  async deleteReview(user: User, reviewId: number) {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    if (review.userId !== user.id) throw new ForbiddenException('삭제 권한이 없습니다.');

    return this.reviewRepository.remove(review);
  }

  private getRandomColor() {
    const colors = ['#FFDDDD', '#DDEEFF', '#DDFFDD', '#FFFFAA', '#EEDDFF', '#FFDDEE', '#E0E0E0', '#F5F5DC'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}