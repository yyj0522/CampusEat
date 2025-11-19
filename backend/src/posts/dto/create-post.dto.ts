import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isAnonymous?: boolean;

  @IsString()
  @IsOptional()
  slideImage?: string;

  @IsString()
  @IsOptional()
  slideCaption?: string;

  @IsString()
  @IsOptional()
  slideCaptionSmall?: string;

  @IsString()
  @IsOptional()
  slideBackgroundColor?: string; 

  @IsString()
  @IsOptional()
  authorDisplayName?: string;
}