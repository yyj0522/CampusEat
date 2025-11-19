import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateReportDto {
  @IsNumber()
  @IsOptional()
  reportedUserId?: number;
  
  @IsNumber()
  @IsOptional()
  reportedRestaurantId?: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  details?: string;

  @IsString()
  @IsOptional()
  contextType?: string;

  @IsString()
  @IsOptional()
  contextId?: string;
}