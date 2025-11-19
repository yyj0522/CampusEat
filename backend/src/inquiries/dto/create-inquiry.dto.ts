import { IsNotEmpty, IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateInquiryDto {
  @IsString()
  @IsNotEmpty({ message: '제목은 필수 입력 항목입니다.' })
  @MaxLength(100, { message: '제목은 100자 이하로 작성해야 합니다.' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '내용은 필수 입력 항목입니다.' })
  @MinLength(10, { message: '내용은 최소 10자 이상 작성해야 합니다.' })
  content: string;

  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '답변 받을 이메일은 필수 입력 항목입니다.' })
  replyEmail: string;
}
