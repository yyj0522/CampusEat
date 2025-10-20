import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4, { message: 'Password must be at least 4 characters long' })
  password: string;

  @IsString()
  @IsOptional() // university는 Step2에서 추가되므로 선택 사항입니다.
  university?: string;
  
  @IsEmail()
  @IsOptional() // universityEmail은 Step2에서 추가되므로 선택 사항입니다.
  universityEmail?: string;
}
