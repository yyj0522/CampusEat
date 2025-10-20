// src/messages/dto/create-message.dto.ts
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

  // ✅ 2. isRecipientAnonymous 필드를 DTO에 추가
  @IsBoolean()
  @IsOptional()
  isRecipientAnonymous?: boolean;
}
