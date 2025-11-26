import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { StandardizedTimetable } from './timetable.interface';
import puppeteer from 'puppeteer-extra';
import { Browser, Page } from 'puppeteer';
import StealthPlugin = require('puppeteer-extra-plugin-stealth');
import { IDynamicScraperStrategy } from './scrapers/i-dynamic-scraper.strategy';
import { GachonGeneralStrategy } from './scrapers/gachon-general.strategy';

puppeteer.use(StealthPlugin());

@Injectable()
export class DynamicScraperService {
  private readonly logger = new Logger(DynamicScraperService.name);

  private readonly strategyMap = new Map<string, IDynamicScraperStrategy>([
    ['gachon-general', new GachonGeneralStrategy()],
  ]);

  constructor() {}

  async parseUrl(
    url: string,
    year: number,
    semester: string,
    universityId: string,
  ): Promise<StandardizedTimetable> {

    const strategy = this.strategyMap.get(universityId);
    if (!strategy) {
      throw new NotFoundException(`'${universityId}' 전략 없음`);
    }

    this.logger.log(`Dynamic 스크래핑 시작... (URL: ${url})`);

    let browser: Browser | null = null;
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/chromium-browser', 
        protocolTimeout: 180000,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      
      // IDynamicScraperStrategy의 execute 메서드 호출 (인터페이스와 일치)
      const result = await strategy.execute(browser, url, year, semester);
      this.logger.log(`Dynamic 스크래핑 완료 → ${result.lectures.length}개 강의 처리됨`);

      return result;

    } catch (e) {
      this.logger.error(`Puppeteer 실행 오류: ${e.message}`);
      throw new Error(`Dynamic 스크래핑 실패: ${e.message}`);
    } finally {
      if (browser) await browser.close();
    }
  }
}
