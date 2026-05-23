import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNodeDto {
  @ApiProperty({ enum: ['file', 'folder'] })
  @IsIn(['file', 'folder'])
  kind!: 'file' | 'folder';

  @ApiProperty({ example: 'drafts/contract.md' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  path!: string;

  @ApiProperty({ required: false, description: 'Initial text content (file only)' })
  @IsOptional()
  @IsString()
  content?: string;
}
