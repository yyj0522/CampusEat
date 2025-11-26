import { StandardizedTimetable } from '../timetable.interface';

export interface IScraperStrategy {
  parse(html: string, year: number, semester: string): StandardizedTimetable;
}
