import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { StandardizedTimetable } from './timetable.interface';
import puppeteer from 'puppeteer-extra';
import { Browser, Page } from 'puppeteer';
import StealthPlugin = require('puppeteer-extra-plugin-stealth');
import { IScraperStrategy } from './scrapers/i-scraper.strategy';
import { EuljiGeneralStrategy } from './scrapers/eulji-general.strategy';

puppeteer.use(StealthPlugin());

@Injectable()
export class HtmlScraperService {
  private readonly logger = new Logger(HtmlScraperService.name);

  private readonly strategyMap = new Map<string, IScraperStrategy>([
    ['eulji-general', new EuljiGeneralStrategy()],
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
      throw new NotFoundException(`'${universityId}' 스크래퍼 없음`);
    }

    this.logger.log(`HTML 스크래핑 시작... (URL: ${url})`);

    let browser: Browser | null = null;
    let html: string;

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
      
      const page: Page = await browser.newPage();

      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1280, height: 720 });
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
      html = await page.content();
      
      return strategy.parse(html, year, semester); 
    } catch (e) {
      this.logger.error(`Puppeteer 실행 오류: ${e.message}`);
      throw new Error(`페이지 불러오기 실패: ${e.message}`);
    } finally {
      if (browser) await browser.close();
    }
  }
}
