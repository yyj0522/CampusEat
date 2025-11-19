import { Browser } from 'puppeteer';
import { StandardizedTimetable } from '../timetable.interface';

export interface IDynamicScraperStrategy {
  execute(
    browser: Browser,
    url: string,
    year: number,
    semester: string,
  ): Promise<StandardizedTimetable>;
}