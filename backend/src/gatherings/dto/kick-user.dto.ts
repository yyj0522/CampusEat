import { IsInt, IsNotEmpty } from 'class-validator';

export class KickUserDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;
}