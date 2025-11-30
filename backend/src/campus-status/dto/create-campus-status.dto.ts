import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCampusStatusDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  weatherCondition?: string;
}