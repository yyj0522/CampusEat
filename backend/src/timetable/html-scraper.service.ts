import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  StandardizedTimetable,
} from './timetable.interface';
import puppeteer from 'puppeteer-extra';
import { Browser } from 'puppeteer';
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
      this.logger.error(`'${universityId}'에 대한 스크래퍼 전략이 없습니다.`);
      throw new NotFoundException(
        `'${universityId}'에 대한 스크래퍼 전략이 없습니다.`,
      );
    }

    this.logger.log(`HTML 스크래핑 시작... (URL: ${url})`);

    let browser: Browser | null = null;
    let html: string;
    try {
      browser = await puppeteer.launch();
      const page = await browser.newPage();
      
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      );
      
      await page.goto(url, { waitUntil: 'networkidle0' });

      const MAX_PAGES_TO_SEARCH = 5;
      const keyword = '시간표';
      let postFound = false;
      
      for (let currentPage = 1; currentPage <= MAX_PAGES_TO_SEARCH; currentPage++) {
        this.logger.log(`'${keyword}' 키워드 검색 중... (페이지: ${currentPage})`);

        const postLinkXPath = `//a[contains(., "${keyword}")]`;
        const postLinks = await page.$$('xpath/' + postLinkXPath);

        if (postLinks.length > 0) {
          this.logger.log(`'${keyword}' 포함 링크 찾음. 클릭 시도...`);
          
          await postLinks[0].click();
          
          this.logger.log(`게시글 내용 로딩 대기 중...`);
          await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 });

          this.logger.log('게시글 내용 로드 완료.');
          postFound = true;
          break; 
        }

        this.logger.log(`'${keyword}' 링크를 ${currentPage}페이지에서 찾지 못했습니다.`);
        if (currentPage < MAX_PAGES_TO_SEARCH) {
          const nextPageNumber = currentPage + 1;
          this.logger.log(`${nextPageNumber}페이지로 이동 시도...`);

          const pageLinkXPath = `//div[contains(@class, 'paging')]//a[normalize-space(text()) = '${nextPageNumber}']`;
          const pageLinks = await page.$$('xpath/' + pageLinkXPath);

          if (pageLinks.length > 0) {
            await pageLinks[0].click();
            
            await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 });
            await page.waitForSelector('div.board_list'); 
          } else {
            this.logger.warn(`${nextPageNumber}페이지 링크를 찾지 못해 검색을 중단합니다.`);
            break; 
          }
        }
      } 

      if (!postFound) {
        throw new Error(`'${keyword}' 키워드가 포함된 게시글을 ${MAX_PAGES_TO_SEARCH}페이지 내에서 찾지 못했습니다.`);
      }

      html = await page.content();

    } catch (e) {
      this.logger.error('Puppeteer 실행 중 오류 발생', e);
      throw new Error(`페이지를 불러오는 데 실패했습니다: ${e.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    const standardJson = strategy.parse(html, year, semester);

    this.logger.log(`스크래핑 완료: ${standardJson.lectures.length}개 강의 처리`);

    return standardJson;
  }
}