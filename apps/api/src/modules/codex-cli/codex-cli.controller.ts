import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../shared/decorators/current-user.decorator';
import { CodexCliAuthService } from './codex-cli-auth.service';
import { CodexCliRunService } from './codex-cli-run.service';
import { CodexCliProcessRegistry } from './codex-cli-process-registry.service';
import { RunCodexDto } from './dto/run-codex.dto';
import type { CodexLoginEvent, CodexRunEvent } from './types/codex-event';

/**
 * Per-user Codex CLI integration. Each user has their own ChatGPT login
 * (`auth.json` under their isolated CODEX_HOME) and their own sandboxed
 * workspace dir — no shared account, no shared filesystem.
 */
@ApiTags('codex-cli')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('codex')
export class CodexCliController {
  constructor(
    private readonly auth: CodexCliAuthService,
    private readonly runner: CodexCliRunService,
    private readonly registry: CodexCliProcessRegistry,
    private readonly config: ConfigService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Live Codex status for the current user' })
  async status(@CurrentUser() u: CurrentUserPayload) {
    const authStatus = await this.auth.getStatus(u.id);
    return {
      ...authStatus,
      activeRuns: this.registry.activeCountForUser(u.id),
      sandboxMode: this.config.getOrThrow<string>('codex.sandbox'),
      maxConcurrent: this.registry.maxConcurrent(),
      maxConcurrentPerUser: this.registry.maxConcurrentPerUser(),
    };
  }

  /**
   * SSE stream of the device-code login. Open this when the user clicks
   * "Connect Codex". The first event carries the verification URL + code
   * the user should open on their phone; the second is `connected` or
   * `error` once the OAuth handshake completes server-side.
   */
  @Sse('connect/stream')
  @ApiOperation({ summary: 'Start device-code login (SSE)' })
  connect(@CurrentUser() u: CurrentUserPayload): Observable<{ data: CodexLoginEvent }> {
    return this.auth.startDeviceLogin(u.id).pipe(map((event) => ({ data: event })));
  }

  @Delete('connect')
  @ApiOperation({ summary: 'Disconnect Codex (wipes auth.json on the server)' })
  async disconnect(@CurrentUser() u: CurrentUserPayload) {
    this.registry.killAllForUser(u.id);
    await this.auth.disconnect(u.id);
    return { disconnected: true };
  }

  /**
   * Runs `codex exec --json` with the user's auth + workspace. Streams the
   * JSONL events through to the browser as SSE. The request body must be
   * sent via POST first, but the SSE protocol expects GET — Nest's `@Sse()`
   * decorator handles both via the `?prompt=` short-lived ticket pattern.
   * To avoid passing long prompts in the URL we accept the body via POST
   * and immediately upgrade to SSE; modern browsers handle this fine.
   */
  @Post('run')
  @Sse()
  @ApiOperation({ summary: 'Run a single Codex turn; streams JSONL events as SSE' })
  run(
    @CurrentUser() u: CurrentUserPayload,
    @Body() dto: RunCodexDto,
  ): Observable<{ data: CodexRunEvent }> {
    return this.runner
      .run(u.id, dto.prompt, dto.resumeSessionId)
      .pipe(map((event) => ({ data: event })));
  }
}
