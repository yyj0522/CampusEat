import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v1 } from '@google-cloud/documentai';
import { StandardizedLecture, StandardizedTimetable } from './timetable.interface';

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);
  private readonly client: v1.DocumentProcessorServiceClient;

  private readonly processorEndpointMap = new Map<string, string>([
    [
      'baekseok-major',
      'projects/804568381273/locations/us/processors/fc45c96d59552b9e',
    ],
  ]);

  constructor() {
    this.client = new v1.DocumentProcessorServiceClient();
  }

  async parsePdf(
    pdfFileBuffer: Buffer,
    year: number,
    semester: string,
    universityId: string,
  ): Promise<StandardizedTimetable> {
    const processorEndpoint = this.processorEndpointMap.get(universityId);

    if (!processorEndpoint) {
      this.logger.error(`'${universityId}'에 대한 PDF 파서 설정이 없습니다.`);
      throw new NotFoundException(
        `'${universityId}'에 대한 PDF 파서 설정이 없습니다.`,
      );
    }

    this.logger.warn(`===========================================================`);
    this.logger.warn(`🚀 [1단계] Document AI 요청 시작`);
    this.logger.warn(`👉 사용 중인 프로세서 주소: ${processorEndpoint}`);
    this.logger.warn(`===========================================================`);

    const base64Pdf = pdfFileBuffer.toString('base64');

    const request = {
      name: processorEndpoint,
      rawDocument: {
        content: base64Pdf,
        mimeType: 'application/pdf',
      },
      skipHumanReview: true,
    };

    const [result] = await this.client.processDocument(request);
    this.logger.log('Document AI 분석 완료. 데이터 매핑 시작...');

    const standardJson = this.transformToStandardFormat(
      result.document,
      universityId,
      year,
      semester,
    );

    return standardJson;
  }

  private transformToStandardFormat(
    document: any,
    universityId: string,
    year: number,
    semester: string,
  ): StandardizedTimetable {
    if (universityId.startsWith('baekseok')) {
      return this.parseBaekseokFormat(document, universityId, year, semester);
    }

    return this.parseGeneralFormat(document, universityId, year, semester);
  }

  private parseBaekseokFormat(
    document: any,
    universityId: string,
    year: number,
    semester: string,
  ): StandardizedTimetable {
    const department =
      document.entities.find((e: any) => e.type === 'department')
        ?.mentionText || 'N/A';

    const courseType = universityId.includes('general') ? 'General' : 'Major';

    const standardJson: StandardizedTimetable = {
      university: '백석대학교',
      campus: '천안',
      department: department,
      year: year,
      semester: semester,
      lectures: [],
      courseType: courseType,
    };

    const majorEntities = document.entities.filter((e: any) => e.type === 'major');
    
    this.logger.warn(`📋 [2단계] AI가 발견한 전공(Major) 목록 (총 ${majorEntities.length}개)`);
    majorEntities.forEach((m: any, idx: number) => {
        const text = m.mentionText ? m.mentionText.replace(/\n/g, '').trim() : 'NULL';
        const pNum = m.pageAnchor?.pageRefs?.[0]?.page || 0;
        this.logger.warn(`   🔹 [전공 #${idx + 1}] 텍스트: "${text}" | 발견 위치: ${pNum} 페이지`);
    });

    const lectureEntities = document.entities.filter(
      (e: any) => e.type === 'lectures',
    );

    this.logger.warn(`📊 [3단계] 강의 테이블 처리 시작 (총 ${lectureEntities.length}개 테이블)`);

    for (const [index, entity] of lectureEntities.entries()) {
      const pageIndex = entity.pageAnchor?.pageRefs?.[0]?.page || 0;

      const matchingMajor = majorEntities.find((m: any) => {
        const majorPage = m.pageAnchor?.pageRefs?.[0]?.page || 0;
        return majorPage === pageIndex;
      });

      const majorName = matchingMajor 
        ? matchingMajor.mentionText.replace(/\n/g, '').trim() 
        : '전공 미상';

      this.logger.log(`   ➡️ [테이블 #${index + 1}] 위치: ${pageIndex} 페이지 | 매핑된 전공: "${majorName}"`);

      const props = entity.properties;
      const getString = (type: string) =>
        props.find((p: any) => p.type === type)?.mentionText || '';

      const rawSchedule = getString('schedule_raw');
      const classroom = getString('classroom');

      const schedule = this.parseBaekseokSchedule(rawSchedule, classroom);

      standardJson.lectures.push({
        group: getString('group_name'),
        courseCode: getString('course_code'),
        courseName: getString('course_name'),
        hours: parseInt(getString('hours')) || 0,
        credits: parseInt(getString('credits')) || 0,
        capacity: parseInt(getString('capacity')) || 0,
        professor: getString('professor'),
        major: majorName,
        schedule: schedule,
      });
    }

    this.logger.log(`후처리 완료: ${standardJson.lectures.length}개 강의 처리`);
    return standardJson;
  }

  private parseGeneralFormat(
    document: any,
    universityId: string,
    year: number,
    semester: string,
  ): StandardizedTimetable {
    const department =
      document.entities.find((e: any) => e.type === 'department')
        ?.mentionText || 'N/A';

    const major =
      document.entities.find((e: any) => e.type === 'major')?.mentionText ||
      'N/A';

    const courseType = universityId.includes('general') ? 'General' : 'Major';

    const standardJson: StandardizedTimetable = {
      university: 'N/A',
      campus: 'N/A',
      department: department,
      major: major, 
      year: year,
      semester: semester,
      lectures: [],
      courseType: courseType,
    };

    const lectureEntities = document.entities.filter(
      (e: any) => e.type === 'lectures',
    );

    for (const entity of lectureEntities) {
      const props = entity.properties;
      const getString = (type: string) =>
        props.find((p: any) => p.type === type)?.mentionText || '';

      const rawSchedule = getString('schedule_raw');
      const classroom = getString('classroom');

      const schedule = this.parseBaekseokSchedule(rawSchedule, classroom);

      standardJson.lectures.push({
        group: getString('group_name'),
        courseCode: getString('course_code'),
        courseName: getString('course_name'),
        hours: parseInt(getString('hours')) || 0,
        credits: parseInt(getString('credits')) || 0,
        capacity: parseInt(getString('capacity')) || 0,
        professor: getString('professor'),
        major: major, 
        schedule: schedule,
      });
    }

    return standardJson;
  }

  private parseBaekseokSchedule(
    rawSchedule: string,
    classroom: string,
  ): StandardizedLecture['schedule'] {
    const results: StandardizedLecture['schedule'] = [];
    if (!rawSchedule) return results;

    const parts = rawSchedule.split('/');

    for (const part of parts) {
      const trimmedPart = part.trim();

      if (trimmedPart === '사') {
        results.push({
          day: '사이버',
          periods: [],
          classroom: '사이버강의',
        });
        continue;
      }

      const match = trimmedPart.match(/^(월|화|수|목|금|토|일)([\d,]+)$/);

      if (match) {
        const day = match[1];
        const periods = match[2].split(',').map(Number);

        results.push({
          day: day,
          periods: periods,
          classroom: classroom,
        });
      }
    }
    return results;
  }
}