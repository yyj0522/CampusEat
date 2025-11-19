import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Timetable } from './timetable.entity';
import { TimetableLecture } from './timetable-lecture.entity';
import { Lecture } from './lecture.entity';
import { User } from '../users/user.entity';

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(Timetable)
    private timetableRepository: Repository<Timetable>,
    @InjectRepository(TimetableLecture)
    private timetableLectureRepository: Repository<TimetableLecture>,
    @InjectRepository(Lecture)
    private lectureRepository: Repository<Lecture>,
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
    });

    if (!timetable) {
      throw new NotFoundException('시간표를 찾을 수 없습니다.');
    }

    return this.timetableRepository.remove(timetable);
  }

  async addLecture(user: User, timetableId: number, lectureId: number) {
    const timetable = await this.timetableRepository.findOne({ 
      where: { id: timetableId, user: { id: user.id } } 
    });
    if (!timetable) throw new NotFoundException('시간표를 찾을 수 없습니다.');

    const lecture = await this.lectureRepository.findOne({ where: { id: lectureId } });
    if (!lecture) throw new NotFoundException('강의 정보를 찾을 수 없습니다.');

    const newLecture = this.timetableLectureRepository.create({
      timetable,
      lectureId: lecture.id,
      courseName: lecture.courseName,
      professor: lecture.professor,
      courseCode: lecture.courseCode,
      schedule: lecture.schedule,
      color: this.getRandomColor(),
    });

    return this.timetableLectureRepository.save(newLecture);
  }

  async addCustomLecture(user: User, timetableId: number, data: any) {
    const timetable = await this.timetableRepository.findOne({ 
        where: { id: timetableId, user: { id: user.id } } 
    });
    if (!timetable) throw new NotFoundException('시간표를 찾을 수 없습니다.');

    const newLecture = this.timetableLectureRepository.create({
      timetable,
      lectureId: null,
      courseName: data.courseName,
      professor: data.professor,
      courseCode: 'CUSTOM',
      schedule: data.schedule,
      color: this.getRandomColor(),
    });

    return this.timetableLectureRepository.save(newLecture);
  }
  
  async deleteLecture(user: User, lectureId: number) {
    const lecture = await this.timetableLectureRepository.findOne({
        where: { id: lectureId },
        relations: ['timetable', 'timetable.user']
    });
    
    if (!lecture || lecture.timetable.user.id !== user.id) {
        throw new NotFoundException('강의를 찾을 수 없거나 권한이 없습니다.');
    }

    return this.timetableLectureRepository.remove(lecture);
  }

  private getRandomColor() {
    const colors = ['#FFDDDD', '#DDEEFF', '#DDFFDD', '#FFFFAA', '#EEDDFF', '#FFDDEE', '#E0E0E0', '#F5F5DC'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}