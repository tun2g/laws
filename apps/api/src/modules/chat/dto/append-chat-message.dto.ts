import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AppendChatMessageDto {
  @ApiProperty({ example: 'Phân tích sâu hơn về điểm thứ 3.' })
  @IsString()
  @MinLength(1)
  @MaxLength(16_000)
  content!: string;
}
