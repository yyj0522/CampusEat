import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Timetable } from './timetable.entity';
import { TimetableLecture } from './timetable-lecture.entity';
import { Lecture } from './lecture.entity';
import { LectureReview } from './lecture-review.entity';
import { User } from '../users/user.entity';
import { RedisManagerService } from '../common/redis/redis-manager.service';
import { GenerateTimetableDto } from './dto/generate-timetable.dto';

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

  async generateTimetable(user: User, dto: GenerateTimetableDto) {
    const { timetableId, targetDepartment, majorCount, geCount, minCredits, maxCredits, preferredDays, avoidLunch, includeCyber } = dto;

    const currentTimetable = await this.timetableRepository.findOne({
      where: { id: timetableId, user: { id: user.id } },
      relations: ['lectures'],
    });
    if (!currentTimetable) throw new NotFoundException('시간표를 찾을 수 없습니다.');

    const fixedLectures = currentTimetable.lectures;
    const fixedCredits = fixedLectures.reduce((acc, l) => acc + (Number(l.credits) || 0), 0);
    const existingNames = new Set(fixedLectures.map(l => l.courseName.trim()));
    const existingIds = new Set(fixedLectures.map(l => l.lectureId));

    const baseUniversity = user.university.replace(/\(.*\)/, '').trim();

    const majorCandidatesRaw = await this.lectureRepository.find({
      where: {
        university: baseUniversity,
        department: targetDepartment,
        year: currentTimetable.year,
        semester: currentTimetable.semester,
      }
    });
    
    const geCandidatesRaw = await this.lectureRepository.find({
      where: {
        university: baseUniversity,
        department: '교양',
        year: currentTimetable.year,
        semester: currentTimetable.semester,
      }
    });

    const isDayMatch = (lecture: Lecture) => {
      if (!lecture.schedule || lecture.schedule.length === 0) return includeCyber;
      
      const isCyber = lecture.schedule.some(s => s.day === '사이버' || s.day === 'Cyber');
      if (isCyber) return includeCyber;

      if (avoidLunch) {
        const hasLunch = lecture.schedule.some(s => s.periods.includes(4));
        if (hasLunch) return false;
      }

      return lecture.schedule.every(s => preferredDays.includes(s.day));
    };

    const cleanMajorCandidates = this.shuffleArray(
      majorCandidatesRaw.filter(l => !existingIds.has(l.id) && !existingNames.has(l.courseName.trim()) && isDayMatch(l))
    );

    const cleanGeCandidates = this.shuffleArray(
      geCandidatesRaw.filter(l => !existingIds.has(l.id) && !existingNames.has(l.courseName.trim()) && isDayMatch(l))
    );

    const allFoundCombinations: Lecture[][] = [];
    const MAX_SEARCH = 500; 

    const search = (
      currentSet: Lecture[],
      mCount: number,
      gCount: number,
      currentCreds: number,
      mIndex: number,
      gIndex: number
    ) => {
      if (allFoundCombinations.length >= MAX_SEARCH) return;

      if (mCount === majorCount && gCount === geCount) {
        if (currentCreds >= minCredits && currentCreds <= maxCredits) {
          allFoundCombinations.push([...currentSet]);
        }
        return;
      }

      if (currentCreds > maxCredits) return;

      if (mCount < majorCount) {
        for (let i = mIndex; i < cleanMajorCandidates.length; i++) {
          const candidate = cleanMajorCandidates[i];
          
          if (this.hasDuplicateName(currentSet, candidate)) continue;

          if (!this.checkConflict([...fixedLectures, ...currentSet], candidate)) {
             search(
               [...currentSet, candidate],
               mCount + 1,
               gCount,
               currentCreds + (Number(candidate.credits) || 0),
               i + 1,
               gIndex
             );
             if (allFoundCombinations.length >= MAX_SEARCH) return;
          }
        }
      }

      if (gCount < geCount) {
         for (let i = gIndex; i < cleanGeCandidates.length; i++) {
          const candidate = cleanGeCandidates[i];
          
          if (this.hasDuplicateName(currentSet, candidate)) continue;

          if (!this.checkConflict([...fixedLectures, ...currentSet], candidate)) {
             search(
               [...currentSet, candidate],
               mCount,
               gCount + 1,
               currentCreds + (Number(candidate.credits) || 0),
               mIndex,
               i + 1
             );
             if (allFoundCombinations.length >= MAX_SEARCH) return;
          }
        }
      }
    };

    search([], 0, 0, fixedCredits, 0, 0);

    const resultBuckets: { [key: number]: { score: number, combo: Lecture[] }[] } = {};
    for (let c = minCredits; c <= maxCredits; c++) {
      resultBuckets[c] = [];
    }

    allFoundCombinations.forEach(combo => {
      const totalCreds = fixedCredits + combo.reduce((acc, l) => acc + (Number(l.credits) || 0), 0);
      if (resultBuckets[totalCreds]) {
        const fullTimetable = [...fixedLectures, ...combo];
        const score = this.calculateTimetableScore(fullTimetable);
        resultBuckets[totalCreds].push({ score, combo });
      }
    });

    const finalCombinations: Lecture[][] = [];

    for (let c = minCredits; c <= maxCredits; c++) {
      const bucket = resultBuckets[c];
      if (bucket.length > 0) {
        bucket.sort((a, b) => a.score - b.score);
        finalCombinations.push(bucket[0].combo);
        if (bucket.length > 1) {
          finalCombinations.push(bucket[1].combo);
        }
      }
    }

    return {
      combinations: finalCombinations,
      message: finalCombinations.length > 0 ? '성공' : '조건에 맞는 시간표를 찾지 못했습니다.',
    };
  }

  private hasDuplicateName(currentSet: Lecture[], newLecture: Lecture): boolean {
    return currentSet.some(l => l.courseName.trim() === newLecture.courseName.trim());
  }

  private checkConflict(currentLectures: any[], newLecture: Lecture): boolean {
    if (!newLecture.schedule || newLecture.schedule.length === 0) return false;

    const isNewCyber = newLecture.schedule.some((s: any) => s.day === '사이버' || s.day === 'Cyber');
    if (isNewCyber) return false;

    for (const existing of currentLectures) {
      if (!existing.schedule || existing.schedule.length === 0) continue;
       const isExistingCyber = existing.schedule.some((s: any) => s.day === '사이버' || s.day === 'Cyber');
       if (isExistingCyber) continue;

      for (const t1 of existing.schedule) {
        for (const t2 of newLecture.schedule) {
          if (t1.day === t2.day) {
            const overlap = t1.periods.some((p: number) => t2.periods.includes(p));
            if (overlap) return true;
          }
        }
      }
    }
    return false;
  }

  private calculateTimetableScore(lectures: any[]): number {
    let score = 0;
    const daySchedules: { [key: string]: number[] } = {};

    lectures.forEach(l => {
      if (l.schedule && l.schedule.length > 0) {
        l.schedule.forEach((s: any) => {
          if (s.day === '사이버' || s.day === 'Cyber') return;
          if (!daySchedules[s.day]) daySchedules[s.day] = [];
          
          s.periods.forEach((p: number) => {
            daySchedules[s.day].push(p);
            
            if (p <= 2 || p >= 8) {
              score += 10;
            }
          });
        });
      }
    });

    for (const day in daySchedules) {
      const periods = daySchedules[day].sort((a, b) => a - b);
      if (periods.length > 1) {
        const minP = periods[0];
        const maxP = periods[periods.length - 1];
        const span = maxP - minP + 1;
        const actualClassCount = periods.length;
        const emptySpace = span - actualClassCount;
        
        score += (emptySpace * 5); 
      }
    }

    return score;
  }

  private shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}