import {
  IsString, IsNotEmpty, IsInt, Min,
  IsOptional, IsUrl, IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  bookTitle: string;

  @IsString()
  @IsOptional()
  courseName?: string;

  @IsInt()
  @Min(0)
  originalPrice: number;

  @IsInt()
  @Min(0)
  sellingPrice: number;
}

export class CreateTradeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBookDto)
  books: CreateBookDto[];
}