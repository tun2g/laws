import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { Observable } from 'rxjs';
import { join } from 'node:path';
import { User } from '../users/entities/user.entity';
import { CodexCliPathsService } from './codex-cli-paths.service';
import type { CodexLoginEvent } from './types/codex-event';
import type { CodexStatusSummary } from '@laws/shared';

/**
 * Drives the Codex CLI device-code flow per user.
 *
 * Flow:
 *   1. spawn `codex login --device-auth` with CODEX_HOME=<userHomeDir>
 *   2. scrape stdout/stderr for the verification URL and one-time code
 *   3. emit `awaiting-user` so the client can show them
 *   4. when the user completes the flow on chatgpt.com, codex exits 0 and
 *      writes auth.json into the user's CODEX_HOME — we mark them connected
 *
 * Each user has a fully isolated CODEX_HOME so their auth tokens never
 * commingle.
 */
@Injectable()
export class CodexCliAuthService {
  private readonly logger = new Logger(CodexCliAuthService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
    private readonly paths: CodexCliPathsService,
  ) {}

  /**
   * Returns an SSE-shaped Observable. Holds the codex process open for the
   * duration of the login (user has to open the URL and approve).
   */
  startDeviceLogin(userId: string): Observable<CodexLoginEvent> {
    return new Observable<CodexLoginEvent>((subscriber) => {
      const binary = this.config.getOrThrow<string>('codex.binary');
      const timeoutMs = this.config.getOrThrow<number>('codex.loginTimeoutMs');
      let child: ChildProcess | null = null;
      let killed = false;

      // Fire 'starting' synchronously so the client always sees activity within
      // a few ms of opening the SSE — independent of mkdir / spawn latency.
      this.logger.log(`codex login subscription opened for user ${userId}`);
      subscriber.next({ type: 'starting' });

      const cleanup = () => {
        killed = true;
        if (child && child.exitCode === null) child.kill('SIGTERM');
      };
      subscriber.add(cleanup);

      const run = async () => {
        // Always start device auth from a clean CODEX_HOME. This avoids stale
        // auth/device state when the user previously connected the wrong
        // ChatGPT account or retried a half-failed device flow.
        await this.paths.wipeHome(userId);
        const { home } = await this.paths.ensureForUser(userId);
        this.logger.log(`codex login workspace ready (CODEX_HOME=${home}); spawning '${binary} login --device-auth'`);

        const proc = spawn(binary, ['login', '--device-auth'], {
          env: { ...process.env, CODEX_HOME: home },
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        child = proc;

        let buffer = '';
        let emittedAwaiting = false;

        const timer = setTimeout(() => {
          this.logger.warn(`codex login timed out for user ${userId}`);
          subscriber.next({
            type: 'error',
            message: 'Login timed out. Please try again.',
          });
          if (proc.exitCode === null) proc.kill('SIGTERM');
          subscriber.complete();
        }, timeoutMs);
        timer.unref();

        const handleChunk = (stream: 'stdout' | 'stderr') => (chunk: Buffer) => {
          const text = chunk.toString('utf8');
          buffer += text;
          this.logger.debug(`[codex login ${stream}] ${text.trimEnd()}`);
          if (!emittedAwaiting) {
            const parsed = this.tryExtractDeviceCode(buffer);
            if (parsed) {
              emittedAwaiting = true;
              this.logger.log(
                `codex login awaiting user (url=${parsed.verificationUrl} code=${parsed.userCode})`,
              );
              subscriber.next({ type: 'awaiting-user', ...parsed });
            }
          }
        };
        proc.stdout?.on('data', handleChunk('stdout'));
        proc.stderr?.on('data', handleChunk('stderr'));

        proc.on('error', (err: Error) => {
          clearTimeout(timer);
          this.logger.error(`codex login spawn error: ${err.message}`);
          subscriber.next({
            type: 'error',
            message: `Failed to launch codex: ${err.message}`,
          });
          subscriber.complete();
        });

        proc.on('exit', async (code) => {
          clearTimeout(timer);
          if (killed) {
            subscriber.complete();
            return;
          }
          const authFile = join(home, 'auth.json');
          if (code === 0 && existsSync(authFile)) {
            const connectedAt = new Date();
            await this.users.update(
              { id: userId },
              {
                codexConnectedAt: connectedAt,
                codexHomeDir: home,
                codexWorkspaceDir: this.paths.workspaceDirFor(userId),
              },
            );
            subscriber.next({
              type: 'connected',
              connectedAt: connectedAt.toISOString(),
            });
          } else {
            const tail = buffer.split('\n').slice(-5).join('\n').trim();
            subscriber.next({
              type: 'error',
              message:
                tail ||
                `codex login exited with code ${code ?? 'null'} and no auth.json`,
            });
          }
          subscriber.complete();
        });
      };

      run().catch((err: Error) => {
        this.logger.error(`Failed to start codex login: ${err.message}`);
        subscriber.next({
          type: 'error',
          message: `Failed to prepare codex workspace: ${err.message}`,
        });
        subscriber.complete();
      });
    });
  }

  async disconnect(userId: string): Promise<void> {
    await this.paths.wipeHome(userId);
    await this.users.update(
      { id: userId },
      { codexConnectedAt: null, codexHomeDir: null, codexWorkspaceDir: null },
    );
  }

  async isConnected(userId: string): Promise<boolean> {
    const u = await this.users.findOne({
      where: { id: userId },
      select: ['codexConnectedAt', 'codexHomeDir'],
    });
    if (!u?.codexConnectedAt || !u.codexHomeDir) return false;
    return existsSync(join(u.codexHomeDir, 'auth.json'));
  }

  async getStatus(userId: string): Promise<Pick<CodexStatusSummary, 'connected' | 'connectedAt'>> {
    const u = await this.users.findOne({
      where: { id: userId },
      select: ['codexConnectedAt', 'codexHomeDir'],
    });
    const homeDir = u?.codexHomeDir ?? null;
    const connected = Boolean(u?.codexConnectedAt) && !!homeDir
      ? existsSync(join(homeDir, 'auth.json'))
      : false;

    return {
      connected,
      connectedAt: connected && u?.codexConnectedAt ? u.codexConnectedAt.toISOString() : null,
    };
  }

  /**
   * Codex v0.133 prints:
   *   1. Open this link in your browser and sign in to your account
   *      https://auth.openai.com/codex/device
   *   2. Enter this one-time code (expires in 15 minutes)
   *      HOTP-B8H3T
   *
   * Code shape is `<3-8 alnum>-<3-8 alnum>`. URL contains "device" or "auth".
   * We require both to appear before emitting so we never ship a half-parsed
   * prompt to the UI.
   */
  private tryExtractDeviceCode(
    text: string,
  ): { verificationUrl: string; userCode: string } | null {
    // Codex prints the URL/code wrapped in ANSI color escapes
    // (e.g. "\x1b[1mHP23-EI247\x1b[0m"). Strip them so word boundaries work.
    // eslint-disable-next-line no-control-regex
    const clean = text.replace(/\x1b\[[0-9;]*m/g, '');
    const urlMatch = clean.match(/https?:\/\/\S*(device|auth)\S*/i);
    const codeMatch = clean.match(/\b([A-Z0-9]{3,8}-[A-Z0-9]{3,8})\b/);
    if (urlMatch && codeMatch) {
      return {
        verificationUrl: urlMatch[0].replace(/[.,)]+$/, ''),
        userCode: codeMatch[1],
      };
    }
    return null;
  }
}
