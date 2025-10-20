// 파일 전체 경로: src/comments/dto/update-comment.dto.ts

import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}