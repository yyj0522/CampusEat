// 파일 전체 경로: src/submissions/dto/create-submission.dto.ts
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  restaurantName: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  description?: string;
}