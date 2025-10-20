// 파일 전체 경로: src/users/dto/update-user.dto.ts

import { IsString, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional() // 닉네임은 선택적으로 변경할 수 있으므로 Optional
  nickname?: string;

  @IsString()
  @IsOptional() // 대학교도 선택적으로 변경할 수 있으므로 Optional
  university?: string;
}