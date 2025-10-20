// 파일 전체 경로: src/auth/dto/find-id.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';

export class FindIdDto {
  @IsEmail()
  @IsNotEmpty()
  universityEmail: string;
}