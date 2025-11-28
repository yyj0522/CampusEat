import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { StandardizedLecture, StandardizedTimetable } from '../timetable.interface';
import { TimetableValidationResult } from './validation-result.dto';

@Injectable()
export class AiValidatorService {
  private readonly logger = new Logger(AiValidatorService.name);
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async validate(
    timetable: StandardizedTimetable,
    currentResult: TimetableValidationResult,
  ): Promise<TimetableValidationResult> {
    const sampleLectures = timetable.lectures.slice(0, 15); 
    const prompt = `
    너는 대학교 학사 관리자야. 아래 JSON 데이터는 PDF에서 OCR로 추출한 시간표 데이터야.
    파싱 과정에서 오류가 발생했을 가능성이 있어.
    
    다음 규칙에 따라 데이터를 검증해줘:
    1. 'professor' 필드에 사람 이름이 아니라 '302호', '월요일' 같은 장소나 시간이 들어가 있으면 오류야.
    2. 'courseName'이 너무 짧거나(1글자), 특수문자로만 되어 있으면 오류야.
    3. 'credits'(학점)이 0인데 'hours'(시수)가 3 이상이면 의심스러워.
    
    데이터:
    ${JSON.stringify(sampleLectures)}

    응답은 오직 JSON 포맷으로만 해줘. 다른 말은 하지 마.
    형식:
    [
      {
        "courseCode": "강의코드",
        "field": "professor",
        "message": "교수명에 강의실 호수가 들어간 것으로 보임",
        "severity": "WARNING"
      }
    ]
    만약 이상이 없으면 빈 배열 []을 반환해.
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o-mini', 
        temperature: 0,
      });

      const content = completion.choices[0].message.content;
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '');
      const aiErrors = JSON.parse(cleanJson);

      aiErrors.forEach((err: any) => {
        const index = timetable.lectures.findIndex(l => l.courseCode === err.courseCode);
        
        currentResult.issues.push({
          lectureIndex: index !== -1 ? index : 0,
          courseName: err.courseCode, 
          field: err.field,
          message: `[AI 감지] ${err.message}`,
          type: 'AI',
          severity: err.severity,
        });
      });

      if (aiErrors.length > 0) {
        currentResult.isValid = false; 
      }

    } catch (error) {
      this.logger.error('AI 검증 중 오류 발생:', error);
    }

    return currentResult;
  }
}