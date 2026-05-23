import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import type { SkillRunKind } from '../entities/skill-run.entity';

const KINDS: SkillRunKind[] = ['research', 'review', 'translate', 'dual-lang', 'docx'];

export class StartSkillDto {
  @ApiProperty()
  @IsUUID()
  projectId!: string;

  @ApiProperty({ enum: KINDS })
  @IsIn(KINDS)
  kind!: SkillRunKind;

  @ApiProperty({
    description:
      'For "research": the client scenario in Vietnamese. ' +
      'For "review" / "translate" / "dual-lang" / "docx": the existing draft Markdown.',
  })
  @IsString()
  @MinLength(1)
  input!: string;

  @ApiProperty({ required: false, description: 'Override LLM model (admin only).' })
  @IsOptional()
  @IsString()
  model?: string;
}
