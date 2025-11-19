import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateMessageDto {
  @IsNumber()
  @IsNotEmpty()
  recipientId: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  sourcePostTitle?: string;

  @IsBoolean()
  @IsOptional()
  isRecipientAnonymous?: boolean;
}
