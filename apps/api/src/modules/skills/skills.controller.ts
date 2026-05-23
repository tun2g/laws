import { Body, Controller, Get, Param, Post, Query, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { SkillsService } from './skills.service';
import { StartSkillDto } from './dto/start-skill.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../shared/decorators/current-user.decorator';
import { SKILLS } from '@laws/skill-prompts';

/**
 * Single entry point for all skills (research, review, translate, dual-lang,
 * docx). The skill kind is encoded in the StartSkillDto.kind field rather
 * than the URL, so adding a new skill is a matter of bundling a new prompt
 * in `@laws/skill-prompts` and listing it here.
 */
@ApiTags('skills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  @ApiOperation({ summary: 'List available skills' })
  listSkills() {
    return Object.values(SKILLS).map((s) => ({
      id: s.id,
      labelVi: s.labelVi,
      labelEn: s.labelEn,
      descriptionVi: s.descriptionVi,
      needsWebSearch: s.needsWebSearch,
    }));
  }

  @Get('runs')
  @ApiOperation({ summary: 'List runs for a project' })
  list(@CurrentUser() u: CurrentUserPayload, @Query('projectId') projectId: string) {
    return this.skills.listByProject(u.id, projectId);
  }

  @Post('runs')
  @ApiOperation({ summary: 'Create a new skill run (queued, not yet executing)' })
  create(@CurrentUser() u: CurrentUserPayload, @Body() dto: StartSkillDto) {
    return this.skills.createRun(u.id, dto);
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'Get a skill run by id' })
  async get(@CurrentUser() u: CurrentUserPayload, @Param('id') id: string) {
    const run = await this.skills.getOwned(u.id, id);
    return this.skills.toDto(run);
  }

  /**
   * Stream the LLM output token-by-token via Server-Sent Events.
   * Open this endpoint immediately after creating a run; the server executes
   * the Codex call and pushes tokens / citations / done as they arrive.
   */
  @Sse('runs/:id/stream')
  @ApiOperation({ summary: 'Stream a skill run via SSE' })
  stream(
    @CurrentUser() u: CurrentUserPayload,
    @Param('id') id: string,
  ): Observable<{ data: unknown }> {
    return this.skills.streamRun(u.id, id).pipe(map((event) => ({ data: event })));
  }
}
