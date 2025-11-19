import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdatePostDto {
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @IsOptional()
  title?: string;

  @IsString({ message: '내용은 문자열이어야 합니다.' })
  @IsOptional()
  content?: string;
  
  @IsBoolean({ message: '익명 여부는 boolean 값이어야 합니다.' })
  @IsOptional()
  isAnonymous?: boolean;

  @IsString({ message: '슬라이드 이미지는 문자열 URL이어야 합니다.' })
  @IsOptional()
  slideImage?: string;

  @IsString({ message: '슬라이드 문구는 문자열이어야 합니다.' })
  @IsOptional()
  slideCaption?: string;

  @IsString({ message: '슬라이드 작은 문구는 문자열이어야 합니다.' })
  @IsOptional()
  slideCaptionSmall?: string;

  @IsString({ message: '슬라이드 배경색은 문자열이어야 합니다.' })
  @IsOptional()
  slideBackgroundColor?: string;

  @IsString({ message: '작성자명은 문자열이어야 합니다.' })
  @IsOptional()
  authorDisplayName?: string;
}