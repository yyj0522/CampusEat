import { IsNumber, IsString, IsArray, IsNotEmpty, IsBoolean } from 'class-validator';

export class GenerateTimetableDto {
  @IsNumber()
  @IsNotEmpty()
  timetableId: number;

  @IsString()
  @IsNotEmpty()
  targetDepartment: string;

  @IsNumber()
  @IsNotEmpty()
  majorCount: number;

  @IsNumber()
  @IsNotEmpty()
  geCount: number;

  @IsNumber()
  @IsNotEmpty()
  minCredits: number;

  @IsNumber()
  @IsNotEmpty()
  maxCredits: number;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  preferredDays: string[];

  @IsBoolean()
  @IsNotEmpty()
  avoidLunch: boolean;

  @IsBoolean()
  @IsNotEmpty()
  includeCyber: boolean;
}