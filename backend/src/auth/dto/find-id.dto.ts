import { IsEmail, IsNotEmpty } from 'class-validator';

export class FindIdDto {
  @IsEmail()
  @IsNotEmpty()
  universityEmail: string;
}