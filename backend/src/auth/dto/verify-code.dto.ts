// 파일 경로: src/auth/dto/verify-code.dto.ts
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}