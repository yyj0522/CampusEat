import {
  IsString, IsNotEmpty, IsDateString, IsInt, Min, Max,
  IsOptional, IsEnum, IsArray,
} from 'class-validator';
import { GatheringType } from '../entities/gathering.entity';

export class CreateGatheringDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(GatheringType)
  @IsNotEmpty()
  type: GatheringType;

  @IsDateString()
  @IsNotEmpty()
  datetime: string;

  @IsInt()
  @Min(2)
  @Max(20)
  maxParticipants: number;

  @IsString()
  @IsNotEmpty()
  location: string; 

  @IsString()
  @IsOptional()
  departure?: string;

  @IsString()
  @IsOptional()
  arrival?: string; 

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}