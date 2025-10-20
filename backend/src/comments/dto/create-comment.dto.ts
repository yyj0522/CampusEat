// 파일 전체 경로: src/comments/dto/create-comment.dto.ts

import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsOptional()
  parentId?: number;

  @IsBoolean() // 이 부분을 추가합니다.
  @IsOptional()
  isAnonymous?: boolean;
}