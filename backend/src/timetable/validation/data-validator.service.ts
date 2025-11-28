import { Injectable, Logger } from '@nestjs/common';
import { StandardizedTimetable, StandardizedLecture } from '../timetable.interface';
import { TimetableValidationResult, ValidationIssue } from './validation-result.dto';

@Injectable()
export class DataValidatorService {
  private readonly logger = new Logger(DataValidatorService.name);
  private readonly VALID_DAYS = ['월', '화', '수', '목', '금', '토', '일', '사이버', 'Cyber'];

  validate(timetable: StandardizedTimetable): TimetableValidationResult {
    const result = new TimetableValidationResult();
    result.totalLectures = timetable.lectures.length;

    timetable.lectures.forEach((lecture, index) => {
      this.validateLecture(lecture, index, result);
    });

    if (result.issues.length > 0) {
      result.isValid = false;
    }

    return result;
  }

  private validateLecture(
    lecture: StandardizedLecture,
    index: number,
    result: TimetableValidationResult,
  ) {
    const addIssue = (field: string, message: string, severity: 'ERROR' | 'WARNING' = 'ERROR') => {
      result.issues.push({
        lectureIndex: index,
        courseName: lecture.courseName,
        field,
        message,
        type: 'STATIC',
        severity,
      });
    };

    if (!lecture.courseCode || lecture.courseCode.length < 2) {
      addIssue('courseCode', '학수번호가 비정상적으로 짧거나 없습니다.');
    }
    if (!lecture.courseName) {
      addIssue('courseName', '강의명이 없습니다.');
    }
    if (lecture.credits < 0 || lecture.credits > 20) {
      addIssue('credits', `학점이 비정상적입니다 (${lecture.credits}).`);
    }
    if (lecture.hours < 0 || lecture.hours > 50) {
      addIssue('hours', `강의 시수가 비정상적입니다 (${lecture.hours}).`);
    }
    if (lecture.hours > lecture.credits * 3) {
      addIssue('hours', `학점(${lecture.credits}) 대비 시수(${lecture.hours})가 너무 높습니다.`, 'WARNING');
    }

    if (!lecture.professor || lecture.professor.trim() === '') {
      addIssue('professor', '교수명이 누락되었습니다.', 'WARNING');
    } else if (/^\d+$/.test(lecture.professor)) {
      addIssue('professor', '교수명이 숫자로만 되어 있습니다.', 'ERROR'); 
    }

    if (!lecture.schedule || lecture.schedule.length === 0) {
      addIssue('schedule', '강의 시간/장소 정보가 없습니다.', 'WARNING');
    } else {
      lecture.schedule.forEach((sch) => {
        if (!this.VALID_DAYS.includes(sch.day)) {
          addIssue('schedule.day', `유효하지 않은 요일입니다: ${sch.day}`);
        }
        if (!sch.periods || sch.periods.length === 0) {
          addIssue('schedule.periods', '교시 정보가 비어 있습니다.');
        }
      });
    }
  }
}