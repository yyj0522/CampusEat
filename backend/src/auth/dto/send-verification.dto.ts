import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string; 

  @IsString()
  @IsNotEmpty()
  university: string;

  @IsEmail()
  @IsNotEmpty()
  universityEmail: string;
}