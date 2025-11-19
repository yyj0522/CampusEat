import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { StandardizedTimetable } from './timetable.interface';
import puppeteer from 'puppeteer-extra';
import { Browser } from 'puppeteer';
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
      this.logger.error(`'${universityId}'에 대한 동적 스크래퍼 전략이 없습니다.`);
      throw new NotFoundException(
        `'${universityId}'에 대한 동적 스K크래퍼 전략이 없습니다.`,
      );
    }

    this.logger.log(`동적 HTML 스크래핑 시작... (URL: ${url})`);

    let browser: Browser | null = null;
    try {
      browser = await puppeteer.launch({ 
        headless: true,
        protocolTimeout: 180000, 
      });

      const standardJson = await strategy.execute(
        browser,
        url,
        year,
        semester,
      );

      this.logger.log(
        `동적 스크래핑 완료: ${standardJson.lectures.length}개 강의 처리`,
      );
      return standardJson;
    } catch (e) {
      this.logger.error('Puppeteer 동적 실행 중 오류 발생', e);
      throw new Error(`페이지 상호작용에 실패했습니다: ${e.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}