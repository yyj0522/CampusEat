// 파일 전체 경로: src/reviews/dto/create-review.dto.ts
import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer'; // 👈 class-transformer를 임포트합니다.

export class CreateReviewDto {
   @IsString()
   @IsNotEmpty()
   content: string;

   @Type(() => Number) // 👈 문자열로 들어온 값을 숫자로 변환하도록 설정
   @IsNumber()
   @Min(1)
   @Max(5)
   rating: number;
}