import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class MoveNodeDto {
  @ApiProperty({ example: 'drafts/old-name.md' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  from!: string;

  @ApiProperty({ example: 'drafts/new-name.md' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  to!: string;
}
