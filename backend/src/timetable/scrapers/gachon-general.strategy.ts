import { Browser, Page, ElementHandle, Frame } from 'puppeteer';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import { IDynamicScraperStrategy } from './i-dynamic-scraper.strategy';
import {
  StandardizedLecture,
  StandardizedTimetable,
} from '../timetable.interface';

export class GachonGeneralStrategy implements IDynamicScraperStrategy {
  private page: Page;

  private async closeAllDropdowns(logContext: string): Promise<void> {
    const listboxSelector = 'div[role="listbox"]';

    const isListboxVisible = await this.page.evaluate((selector) => {
      const el = document.querySelector(selector);
      return (
        el &&
        window.getComputedStyle(el).display !== 'none' &&
        window.getComputedStyle(el).visibility !== 'hidden'
      );
    }, listboxSelector);

    if (isListboxVisible) {
      console.log(`[${logContext}] 열린 listbox 감지. 닫기 위해 body 클릭.`);
      await this.page.evaluate(() => {
        (document.querySelector('div.cl-layout-content') as HTMLElement)?.click();
      });

      await this.page.waitForFunction(
        (selector) => {
          const el = document.querySelector(selector);
          return (
            !el ||
            window.getComputedStyle(el).display === 'none' ||
            window.getComputedStyle(el).visibility === 'hidden'
          );
        },
        { timeout: 5000 },
        listboxSelector,
      );
    }
  }

  async execute(
    browser: Browser,
    url: string,
    year: number,
    semester: string,
  ): Promise<StandardizedTimetable> {
    const lectures: StandardizedLecture[] = [];
    this.page = await browser.newPage();
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    );

    try {
      await this.page.goto(url, { waitUntil: 'networkidle0' });
      this.page.setDefaultTimeout(60000);

      console.log('페이지 로드 완료. XPath로 요소 검색 시작...');

      const campusButtonXPath = `//div[.//div[text()='구분']]/preceding-sibling::div[contains(@class, 'cl-combobox')][1]//div[contains(@class, 'cl-combobox-button')]`;
      const isuButtonXPath = `//div[.//div[text()='이수']]/preceding-sibling::div[contains(@class, 'cl-combobox')][1]//div[contains(@class, 'cl-combobox-button')]`;
      const haknyeonButtonXPath = `//div[.//div[text()='학년']]/preceding-sibling::div[contains(@class, 'cl-combobox')][3]//div[contains(@class, 'cl-combobox-button')]`;
      const searchButtonXPath = `//div[contains(@class, 'btn-search')]//div[text()='조회']`;

      try {
        await this.page.waitForSelector('xpath/' + campusButtonXPath, {
          visible: true,
        });
        console.log('캠퍼스 콤보박스 XPath 찾음.');
        await this.page.waitForSelector('xpath/' + isuButtonXPath, {
          visible: true,
        });
        console.log('이수 콤보박스 XPath 찾음.');
        await this.page.waitForSelector('xpath/' + haknyeonButtonXPath, {
          visible: true,
        });
        console.log('학년 콤보박스 XPath 찾음.');
        await this.page.waitForSelector('xpath/' + searchButtonXPath, {
          visible: true,
        });
        console.log('조회 버튼 XPath 찾음.');
      } catch (e) {
        throw new Error(
          `XPath waitForSelector 실패. 페이지 구조가 변경되었을 수 있습니다: ${e.message}`,
        );
      }

      const [campusButton] = await this.page.$$('xpath/' + campusButtonXPath);
      if (!campusButton) throw new Error('캠퍼스 버튼을 찾을 수 없습니다.');
      const campusOptions = await this.getDropdownOptions(campusButton, 'campus');
      console.log('캠퍼스 목록:', campusOptions);

      for (const campusName of campusOptions) {
        if (
          !campusName.trim() ||
          campusName === '전체' ||
          campusName.includes('(폐기)')
        )
          continue;
        await this.clickDropdownOption(campusButton, campusName, 'campus');
        await new Promise((r) => setTimeout(r, 1000));
        console.log(`캠퍼스 선택: ${campusName}`);

        const [isuButton] = await this.page.$$('xpath/' + isuButtonXPath);
        if (!isuButton) throw new Error('이수 버튼을 찾을 수 없습니다.');
        const isuOptions = await this.getDropdownOptions(isuButton, 'isu');
        console.log(`  [${campusName}] 이수 목록:`, isuOptions);

        for (const isuName of isuOptions) {
          if (
            !isuName.trim() ||
            isuName === '전체' ||
            isuName.includes('(폐기)')
          )
            continue;
          await this.clickDropdownOption(isuButton, isuName, 'isu');
          await new Promise((r) => setTimeout(r, 1000));
          console.log(`    이수 선택: ${isuName}`);

          const [haknyeonButton] = await this.page.$$('xpath/' + haknyeonButtonXPath);
          if (!haknyeonButton) throw new Error('학년 버튼을 찾을 수 없습니다.');
          const haknyeonOptions = await this.getDropdownOptions(
            haknyeonButton,
            'haknyeon',
          );
          console.log(`      [${isuName}] 학년 목록:`, haknyeonOptions);

          for (const haknyeonName of haknyeonOptions) {
            if (
              !haknyeonName.trim() ||
              haknyeonName === '전체' ||
              haknyeonName.includes('(폐기)')
            )
              continue;
            await this.clickDropdownOption(
              haknyeonButton,
              haknyeonName,
              'haknyeon',
            );
            await new Promise((r) => setTimeout(r, 500));
            console.log(`        학년 선택: ${haknyeonName}`);

            const [searchButton] = await this.page.$$('xpath/' + searchButtonXPath);
            if (!searchButton) throw new Error('조회 버튼을 찾을 수 없습니다.');
            await this.page.evaluate(
              (el) => (el as HTMLElement).click(),
              searchButton,
            );

            try {
              await this.page.waitForSelector(
                'div.cl-grid-cell[data-cellindex="1"]',
                {
                  timeout: 5000,
                },
              );
              await new Promise((r) => setTimeout(r, 1000));

              console.log(`          [${haknyeonName}] 스크롤 및 파싱 시작...`);
              const scrollSelector =
                'div[role="grid"][aria-colcount="12"] div.cl-grid-detail';
              const gridHtmlSelector = 'div[role="grid"][aria-colcount="12"]';

              const scrollableElement = await this.page.$(scrollSelector);
              if (!scrollableElement) {
                console.warn('          ... 스크롤 요소를 찾지 못했습니다.');
                throw new Error('Scroll element not found');
              }

              const boundingBox = await scrollableElement.boundingBox();
              if (boundingBox) {
                await this.page.mouse.move(
                  boundingBox.x + boundingBox.width / 2,
                  boundingBox.y + boundingBox.height / 2,
                );
                await this.page.mouse.click(
                  boundingBox.x + boundingBox.width / 2,
                  boundingBox.y + boundingBox.height / 2,
                );
              }

              const scrapedLectures = new Map<string, StandardizedLecture>();
              let previousMapSize = -1;
              let consecutiveStops = 0;
              const maxStops = 3;

              while (consecutiveStops < maxStops) {
                const html = await this.page.$eval(
                  gridHtmlSelector,
                  (el) => el.innerHTML,
                );
                const $ = cheerio.load(html);

                $('div.cl-grid-row[role="row"]').each((i, row) => {
                  const $cells = $(row).find('div.cl-grid-cell');
                  if ($cells.length < 12) return;

                  const courseCode = $cells.eq(1).text().trim();
                  if (!courseCode) return;

                  const professor = $cells.eq(8).text().trim();
                  const rawSchedule = $cells.eq(9).text().trim();
                  const classroom = $cells.eq(10).text().trim();

                  const scheduleData = this.parseSchedule(rawSchedule, classroom);
                  
                  const scheduleKey = scheduleData.schedule
                    .map((s) => s.day + s.periods.join())
                    .join();
                  const uniqueKey = courseCode + professor + scheduleKey;

                  if (!scrapedLectures.has(uniqueKey)) {
                    const credits = this.parseCredits($cells.eq(6).text().trim());

                    const lecture: StandardizedLecture = {
                      courseCode: courseCode,
                      courseName: $cells.eq(2).text().trim(),
                      group: '',
                      credits: credits,
                      professor: professor,
                      capacity: parseInt($cells.eq(11).text().trim()) || 0,
                      hours: scheduleData.hours,
                      schedule: scheduleData.schedule,
                      campus: campusName,
                      department: $cells.eq(7).text().trim(),
                      major: '',
                      courseType: $cells.eq(5).text().trim(),
                    };
                    scrapedLectures.set(uniqueKey, lecture);
                  }
                });

                const currentMapSize = scrapedLectures.size;
                const newLecturesFound =
                  currentMapSize - (previousMapSize === -1 ? 0 : previousMapSize);

                if (previousMapSize === -1 || newLecturesFound > 0) {
                  console.log(
                    `          ... 스크롤 중 ... 현재 ${currentMapSize}개 수집 (이번 배치에서 ${newLecturesFound}개 신규)`,
                  );
                }

                if (newLecturesFound === 0 && previousMapSize !== -1) {
                  consecutiveStops++;
                  console.log(
                    `          ... 스크롤 중지 카운트: ${consecutiveStops} / ${maxStops}`,
                  );
                } else {
                  consecutiveStops = 0;
                }

                if (consecutiveStops >= maxStops) {
                  console.log(
                    `          ... 스크롤 중지: ${maxStops}회 연속 신규 강의 없음.`,
                  );
                  break;
                }

                previousMapSize = currentMapSize;

                await this.page.keyboard.press('PageDown');
                
                await new Promise((r) => setTimeout(r, 500));
              }

              lectures.push(...scrapedLectures.values());
              console.log(
                `          [${haknyeonName}] 강의 ${scrapedLectures.size}개 스크래핑 완료`,
              );
            } catch (tableError) {
              console.log(
                `          [${haknyeonName}] 강의가 없거나 테이블 로딩에 실패했습니다.`,
              );
            }
          }
        }
      }
    } catch (e) {
      console.error('가천대학교 스크래핑 중 오류 발생:', e);
      throw new Error(`가천대학교 페이지 처리 중 오류: ${e.message}`);
    } finally {
      if (this.page) await this.page.close();
    }

    const uniqueLectures = Array.from(
      new Map(
        lectures.map((lec) => [
          lec.courseCode +
            lec.professor +
            lec.schedule.map((s) => s.day + s.periods.join()).join(),
          lec,
        ]),
      ).values(),
    );

    return {
      university: '가천대학교',
      campus: 'N/A',
      department: 'N/A',
      major: 'N/A',
      year: year,
      semester: semester,
      lectures: uniqueLectures,
      courseType: '',
    };
  }

  private async getDropdownOptions(
    button: ElementHandle<Element>,
    name: string,
  ): Promise<string[]> {
    console.log(`[${name}] 옵션 목록 가져오기 시도...`);

    const options = await this.page.evaluate(
      async (btn, name) => {
        (btn as HTMLElement).click();

        let listbox: Element | null = null;
        let items: NodeListOf<Element> | null = null;

        for (let i = 0; i < 100; i++) {
          listbox = document.querySelector('div[role="listbox"]');
          if (listbox) {
            const style = window.getComputedStyle(listbox);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
              items = listbox.querySelectorAll('li.cl-combobox-item');
              if (items && items.length > 0) {
                break;
              }
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (!listbox || !items || items.length === 0) {
          throw new Error(
            `[${name}] listbox가 10초 이내에 나타나거나, <li> 아이템이 로드되지 않았습니다.`,
          );
        }

        const texts = Array.from(items)
          .map((item) => (item.textContent || '').trim())
          .filter(Boolean);

        (document.querySelector('div.cl-layout-content') as HTMLElement)?.click();
        return texts;
      },
      button,
      name,
    );

    console.log(`[${name}] listbox 확인됨. 옵션 ${options.length}개 발견.`);
    await new Promise((r) => setTimeout(r, 500));
    return options;
  }

  private async clickDropdownOption(
    button: ElementHandle<Element>,
    optionText: string,
    name: string,
  ): Promise<void> {
    console.log(`[${name}] 옵션 "${optionText}" 클릭 시도...`);

    const success = await this.page.evaluate(
      async (btn, text, name) => {
        (btn as HTMLElement).click();

        let listbox: Element | null = null;
        let items: NodeListOf<Element> | null = null;
        let targetItem: Element | undefined = undefined;

        for (let i = 0; i < 100; i++) {
          listbox = document.querySelector('div[role="listbox"]');
          if (listbox) {
            const style = window.getComputedStyle(listbox);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
              items = listbox.querySelectorAll('li.cl-combobox-item');
              if (items && items.length > 0) {
                targetItem = Array.from(items).find(
                  (item) => (item.textContent || '').trim() === text,
                );
                if (targetItem) {
                  break;
                }
              }
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (!targetItem) {
          (
            document.querySelector('div.cl-layout-content') as HTMLElement
          )?.click();
          throw new Error(`[${name}] 옵션 "${text}"을(를) 찾을 수 없습니다.`);
        }

        (targetItem as HTMLElement).click();
        return true;
      },
      button,
      optionText,
      name,
    );

    if (!success) {
      console.warn(`[${name}] 옵션을 찾을 수 없음: ${optionText}.`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  private parseCredits(creditText: string): number {
    const match = creditText.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private parseSchedule(
    rawSchedule: string,
    classroom: string,
  ): { schedule: StandardizedLecture['schedule']; hours: number } {
    const schedule: StandardizedLecture['schedule'] = [];
    const scheduleMap = new Map<string, number[]>();
    let totalHours = 0;

    if (!rawSchedule) {
      return { schedule, hours: 0 };
    }

    const parts = rawSchedule.split(',').filter((p) => p.trim());

    for (const part of parts) {
      const match = part.match(/([월화수목금토일])(\d+)/);
      if (match) {
        const day = match[1];
        const period = parseInt(match[2]);

        if (!scheduleMap.has(day)) {
          scheduleMap.set(day, []);
        }
        scheduleMap.get(day)!.push(period);
        totalHours++;
      }
    }

    for (const [day, periods] of scheduleMap.entries()) {
      periods.sort((a, b) => a - b);
      schedule.push({
        day: day,
        periods: periods,
        classroom: classroom,
      });
    }

    return { schedule, hours: totalHours };
  }
}