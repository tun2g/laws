import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateContentDto {
  @ApiProperty({ example: 'drafts/contract.md' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  path!: string;

  @ApiProperty()
  @IsString()
  content!: string;
}
