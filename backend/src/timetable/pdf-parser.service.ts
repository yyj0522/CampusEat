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
    
    const majorMapByPage = new Map<number, string>();
    
    majorEntities.forEach((m: any) => {
        const text = m.mentionText ? m.mentionText.replace(/\n/g, '').trim() : 'NULL';
        const rawPage = m.pageAnchor?.pageRefs?.[0]?.page;
        const pNum = rawPage !== undefined ? Number(rawPage) : 0;
        majorMapByPage.set(pNum, text);
    });

    const lectureEntities = document.entities.filter(
      (e: any) => e.type === 'lectures',
    );

    for (const entity of lectureEntities) {
      let pageIndex = entity.pageAnchor?.pageRefs?.[0]?.page;

      if (pageIndex === undefined || pageIndex === null) {
          if (entity.properties && entity.properties.length > 0) {
              for (const prop of entity.properties) {
                  const propPage = prop.pageAnchor?.pageRefs?.[0]?.page;
                  if (propPage !== undefined && propPage !== null) {
                      pageIndex = propPage;
                      break; 
                  }
              }
          }
      }

      pageIndex = pageIndex !== undefined ? Number(pageIndex) : 0;

      let majorName = majorMapByPage.get(pageIndex);

      if (!majorName) {
          for (let p = pageIndex - 1; p >= 0; p--) {
              if (majorMapByPage.has(p)) {
                  majorName = majorMapByPage.get(p);
                  break;
              }
          }
      }

      majorName = majorName || '전공 미상';

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
    
    const isCyberByClassroom = !classroom || classroom.trim() === '';

    if (!rawSchedule) {
        if (isCyberByClassroom) {
             results.push({ day: '사이버', periods: [], classroom: '사이버강의' });
        }
        return results;
    }

    const parts = rawSchedule.split('/');

    for (const part of parts) {
      const trimmedPart = part.trim();

      const match = trimmedPart.match(/^(월|화|수|목|금|토|일)([\d,]+)$/);

      if (match) {
        const day = match[1];
        const periods = match[2].split(',').map(Number);

        results.push({
          day: day,
          periods: periods,
          classroom: classroom || '강의실 미정',
        });
      } else {
        if (isCyberByClassroom) {
            if (trimmedPart === '사' || trimmedPart === '사이버' || results.length === 0) {
                 const hasCyber = results.some(r => r.day === '사이버');
                 if (!hasCyber) {
                    results.push({ day: '사이버', periods: [], classroom: '사이버강의' });
                 }
            }
        }
      }
    }
    
    if (results.length === 0 && isCyberByClassroom) {
        results.push({ day: '사이버', periods: [], classroom: '사이버강의' });
    }

    return results;
  }
}