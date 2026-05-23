import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RunCodexDto {
  @IsString()
  @MinLength(1)
  @MaxLength(16_000)
  prompt!: string;

  /**
   * Optional Codex session id to resume. If omitted a fresh session starts.
   * Returned in the `thread.started` JSONL event of any prior run.
   */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  resumeSessionId?: string;
}
