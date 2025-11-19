import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v1 } from '@google-cloud/documentai';

export interface StandardizedLecture {
  group: string;
  courseCode: string;
  courseName: string;
  hours: number;
  credits: number;
  capacity: number;
  professor: string;
  schedule: Array<{
    day: string;
    periods: number[];
    classroom: string;
  }>;
}

export interface StandardizedTimetable {
  university: string;
  campus: string;
  department: string;
  major: string;
  year: number;
  semester: string;
  lectures: StandardizedLecture[];
  courseType: string;
}

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);
  private readonly client: v1.DocumentProcessorServiceClient;

  private readonly processorEndpointMap = new Map<string, string>([
    [
      'baekseok-major',
      'projects/804568381273/locations/us/processors/3105218432a64f1c',
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

    this.logger.log(`Document AI 분석 시작... (대학: ${universityId})`);

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
    this.logger.log('Document AI 분석 완료.');

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

      let schedule: StandardizedLecture['schedule'] = [];

      if (universityId.startsWith('baekseok')) {
        standardJson.university = '백석대학교';
        standardJson.campus = '천안';
        schedule = this.parseBaekseokSchedule(rawSchedule, classroom);
      } else {
        schedule = this.parseBaekseokSchedule(rawSchedule, classroom);
      }

      standardJson.lectures.push({
        group: getString('group_name'),
        courseCode: getString('course_code'),
        courseName: getString('course_name'),
        hours: parseInt(getString('hours')) || 0,
        credits: parseInt(getString('credits')) || 0,
        capacity: parseInt(getString('capacity')) || 0,
        professor: getString('professor'),
        schedule: schedule,
      });
    }

    this.logger.log(`후처리 완료: ${standardJson.lectures.length}개 강의 처리`);
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