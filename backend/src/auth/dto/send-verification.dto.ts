// 파일 경로: src/auth/dto/send-verification.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string; // 기본 이메일 (사용자 식별용)

  @IsString()
  @IsNotEmpty()
  university: string;

  @IsEmail()
  @IsNotEmpty()
  universityEmail: string;
}