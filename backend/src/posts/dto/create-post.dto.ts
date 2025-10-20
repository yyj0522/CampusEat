// 파일 전체 경로: src/posts/dto/create-post.dto.ts

import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  // FormData는 boolean을 string으로 보내므로, string으로 받도록 수정합니다.
  @IsString()
  @IsOptional()
  isAnonymous?: string;
}