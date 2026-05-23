import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import type { ChatSessionKind } from '@laws/shared';

const KINDS: ChatSessionKind[] = ['research', 'review', 'translate', 'dual-lang', 'free'];

export class CreateChatSessionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  projectId!: string;

  @ApiProperty({ enum: KINDS })
  @IsIn(KINDS)
  kind!: ChatSessionKind;

  @ApiProperty({ example: 'Cho tôi biết thủ tục thành lập công ty TNHH.' })
  @IsString()
  @MinLength(1)
  @MaxLength(16_000)
  firstMessage!: string;
}
