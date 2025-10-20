// 파일 전체 경로: src/auth/dto/auth-credentials.dto.ts

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AuthCredentialsDto {
  @IsEmail() // 이메일 형식이어야 합니다.
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4) // 최소 4글자 이상이어야 합니다.
  password: string;
}