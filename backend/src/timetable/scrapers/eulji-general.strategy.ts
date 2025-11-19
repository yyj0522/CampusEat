import { IScraperStrategy } from './i-scraper.strategy';
import {
  StandardizedTimetable,
  StandardizedLecture,
} from '../timetable.interface';
import * as cheerio from 'cheerio';

interface ScraperConfig {
  universityName: string;
  campusName: string;
  courseType: 'Major' | 'General';
  tableSelector: string;
  rowSelector: string;
}

const euljiConfig: ScraperConfig = {
  universityName: '을지대학교',
  campusName: '성남',
  courseType: 'General',
  tableSelector: 'table[border="1"]:has(td:contains("교과목명")):has(td:contains("강의실"))',
  rowSelector: 'tbody tr',
};

export class EuljiGeneralStrategy implements IScraperStrategy {
  parse(html: string, year: number, semester: string): StandardizedTimetable {
    const $ = cheerio.load(html);
    const lectures: StandardizedLecture[] = [];
    const config = euljiConfig;

    let currentGeneralGroup = '';
    let currentGeneralBigo = '';
    let currentUnionGroup = '';

    $(config.tableSelector).each((tableIndex, table) => {
      const $table = $(table);
      const $headerCells = $table.find('tr').first().find('td, th');
      
      let tableType = 'Unknown';
      const headerCol0 = $headerCells.eq(0).text().trim();
      const headerCol1 = $headerCells.eq(1).text().trim();

      if (headerCol0 === '영역명') {
        tableType = 'General';
      } else if (headerCol0 === '구분') {
        tableType = 'Union';
      } else if (headerCol0 === '교과목명' && headerCol1 === '대상전공') {
        tableType = 'MajorSpecific';
      } else if (headerCol0 === '이수구분') {
        tableType = 'MajorFree';
      } else {
        return;
      }

      $table.find(config.rowSelector).each((rowIndex, row) => {
        if (rowIndex === 0) return;

        const $cells = $(row).find('td');

        try {
          let lecture: Partial<StandardizedLecture> = {};
          let bigoText = '';
          let targetMajorText: string | null = null;
          let scheduleData: { schedule: StandardizedLecture['schedule']; hours: number };
          let courseType: 'General' | 'Major' = 'General';

          switch (tableType) {
            case 'General':
              if ($cells.length === 9) { 
                currentGeneralGroup = $cells.eq(0).text().trim().replace(/\s+/g, ' ');
                lecture.courseName = $cells.eq(1).text().trim();
                lecture.credits = parseInt($cells.eq(4).text().trim()) || 0;
                scheduleData = this.parseScheduleAndHours(
                  $cells.eq(5).text().trim(),
                  $cells.eq(6).text().trim(),
                  $cells.eq(7).text().trim(),
                );
                bigoText = $cells.eq(8).text().trim();
                currentGeneralBigo = bigoText; 
              } else if ($cells.length === 8) { 
                lecture.courseName = $cells.eq(0).text().trim();
                lecture.credits = parseInt($cells.eq(3).text().trim()) || 0;
                scheduleData = this.parseScheduleAndHours(
                  $cells.eq(4).text().trim(),
                  $cells.eq(5).text().trim(),
                  $cells.eq(6).text().trim(),
                );
                bigoText = $cells.eq(7).text().trim();
                currentGeneralBigo = bigoText; 
              } else if ($cells.length === 7) { 
                lecture.courseName = $cells.eq(0).text().trim();
                lecture.credits = parseInt($cells.eq(3).text().trim()) || 0;
                scheduleData = this.parseScheduleAndHours(
                  $cells.eq(4).text().trim(),
                  $cells.eq(5).text().trim(),
                  $cells.eq(6).text().trim(),
                );
                bigoText = currentGeneralBigo;
              } else {
                return;
              }
              lecture.group = currentGeneralGroup;
              targetMajorText = bigoText;
              break;

            case 'Union':
              let u_offset = 0;
              let u_group = '';
              if ($cells.length === 8) {
                u_offset = 0;
                u_group = $cells.eq(0).text().trim();
                currentUnionGroup = u_group;
              } else if ($cells.length === 7) {
                u_offset = -1;
                u_group = currentUnionGroup;
              } else {
                return;
              }
              lecture.group = u_group;
              lecture.courseName = $cells.eq(1 + u_offset).text().trim();
              lecture.credits = parseInt($cells.eq(3 + u_offset).text().trim()) || 0;
              bigoText = $cells.eq(7 + u_offset).text().trim();
              scheduleData = this.parseScheduleAndHours(
                $cells.eq(4 + u_offset).text().trim(),
                $cells.eq(5 + u_offset).text().trim(),
                $cells.eq(6 + u_offset).text().trim(),
              );
              targetMajorText = bigoText;
              break;
        
            case 'MajorSpecific':
            case 'MajorFree':
              if ($cells.length !== 9) return;
              const col1 = $cells.eq(0).text().trim();
              const col2 = $cells.eq(1).text().trim();
              
              if (tableType === 'MajorFree') {
                lecture.group = col1;
                lecture.courseName = col2;
                targetMajorText = col1;
              } else {
                lecture.group = col2;
                lecture.courseName = col1;
                targetMajorText = col2;
              }
              
              lecture.credits = parseInt($cells.eq(4).text().trim()) || 0;
              bigoText = $cells.eq(8).text().trim();
              scheduleData = this.parseScheduleAndHours(
                $cells.eq(5).text().trim(),
                $cells.eq(6).text().trim(),
                $cells.eq(7).text().trim(),
              );
              break;
            
            default:
              return;
          }

          if (!lecture.courseName) return;

          courseType = this.determineCourseType(bigoText, targetMajorText);

          lecture.courseCode = "";
          lecture.hours = scheduleData.hours;
          lecture.schedule = scheduleData.schedule;
          lecture.capacity = this.parseCapacity(bigoText);
          lecture.professor = 'N/A';
          
          lectures.push({
            group: lecture.group || 'N/A',
            courseCode: lecture.courseCode,
            courseName: lecture.courseName,
            hours: lecture.hours,
            credits: lecture.credits || 0,
            capacity: lecture.capacity,
            professor: lecture.professor,
            schedule: lecture.schedule,
          });

        } catch (e) {
          console.error('행 파싱 중 오류:', e, $(row).text());
        }
      });
    });

    return {
      university: config.universityName,
      campus: config.campusName,
      department: 'N/A',
      major: 'N/A',
      year: year,
      semester: semester,
      lectures: lectures,
      courseType: 'General',
    };
  }

  private parseCapacity(bigoText: string): number {
    const match = bigoText.match(/수강제한 (\d+)명/);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
    return 0;
  }

  private determineCourseType(bigoText: string, targetMajorText: string | null): 'General' | 'Major' {
    const textToSearch = `${bigoText} ${targetMajorText || ''}`;
    
    const generalKeywords = ['교과목', '수업', '인정', 'Tri-Learn', 'Edu-Us', '수강제한', '온라인'];
    if (generalKeywords.some(kw => textToSearch.includes(kw))) {
    } else {
      if (bigoText.startsWith('수강제한')) return 'General';
    }
  
    const majorKeywords = ['학과', '학부', '전공', 'A1', 'A2', 'A3'];
    if (majorKeywords.some(kw => textToSearch.includes(kw))) {
      if (textToSearch.includes('자유전공학부') && !textToSearch.includes('대상')) {
      } else {
        return 'Major';
      }
    }
    
    return 'General';
  }

  private parseScheduleAndHours(
    day: string,
    periodText: string,
    classroom: string,
  ): { schedule: StandardizedLecture['schedule']; hours: number } {
    let periods: number[] = [];
    let hours = 0;
    const schedule: StandardizedLecture['schedule'] = [];
    
    const cleanedPeriod = periodText.replace(/주/g, '');
    const rangeMatch = cleanedPeriod.match(/(\d+)~(\d+)/);
    const singleMatch = cleanedPeriod.match(/^(\d+)$/);

    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      for (let i = start; i <= end; i++) {
        periods.push(i);
      }
      hours = (end - start) + 1;
    } else if (singleMatch) {
      const period = parseInt(singleMatch[1]);
      periods.push(period);
      hours = 1;
    }
    
    if (day && day !== '-') {
      schedule.push({
        day: day,
        periods: periods,
        classroom: classroom,
      });
    }

    return { schedule, hours };
  }
}