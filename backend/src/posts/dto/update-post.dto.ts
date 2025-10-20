// 파일 전체 경로: src/posts/dto/update-post.dto.ts

import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}