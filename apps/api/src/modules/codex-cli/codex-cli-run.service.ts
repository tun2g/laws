import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Observable } from 'rxjs';
import { User } from '../users/entities/user.entity';
import { CodexCliPathsService } from './codex-cli-paths.service';
import { CodexCliProcessRegistry } from './codex-cli-process-registry.service';
import type { CodexRunEvent } from './types/codex-event';
import type { SkillStreamPart, ChatStreamPart } from './types/stream-parts';
import {
  buildInitialPrompt,
  extractAgentTextDelta,
  extractTokenUsage,
  mapCodexEventToChatParts,
} from './helpers/jsonl-parser';

export type { SkillStreamPart, ChatStreamPart };

/**
 * Spawns `codex exec --json` per request, with the user's CODEX_HOME and a
 * `--cd` scoped to their private workspace. JSONL events from stdout are
 * forwarded one-by-one to the SSE subscriber.
 *
 *   codex exec --json
 *     --cd <user workspace>
 *     --sandbox <configured sandbox>
 *     --skip-git-repo-check
 *     [--resume <sessionId>]
 *     "<prompt>"
 *
 * Each user gets their own CODEX_HOME (auth.json) and their own working
 * directory; sandbox=workspace-write means Codex cannot escape that dir.
 */
@Injectable()
export class CodexCliRunService {
  private readonly logger = new Logger(CodexCliRunService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
    private readonly paths: CodexCliPathsService,
    private readonly registry: CodexCliProcessRegistry,
  ) {}

  run(
    userId: string,
    prompt: string,
    resumeSessionId?: string,
    projectId?: string,
  ): Observable<CodexRunEvent> {
    return new Observable<CodexRunEvent>((subscriber) => {
      let child: ChildProcess | null = null;
      let entry: ReturnType<CodexCliProcessRegistry['attach']> | null = null;

      const cleanup = () => {
        if (child && child.exitCode === null) child.kill('SIGTERM');
        if (entry) this.registry.release(userId, entry);
      };
      subscriber.add(cleanup);

      const run = async () => {
        const user = await this.users.findOne({
          where: { id: userId },
          select: ['codexConnectedAt', 'codexHomeDir', 'codexWorkspaceDir'],
        });
        if (!user?.codexConnectedAt || !user.codexHomeDir) {
          throw new UnauthorizedException({
            code: 'CODEX_NOT_CONNECTED',
            message: 'Connect your Codex (ChatGPT) account first.',
          });
        }
        if (!existsSync(join(user.codexHomeDir, 'auth.json'))) {
          throw new UnauthorizedException({
            code: 'CODEX_AUTH_MISSING',
            message: 'Your Codex session was lost. Please reconnect.',
          });
        }

        // Reserve slot first (throws if at capacity).
        this.registry.reserve(userId);

        const workspace = projectId
          ? await this.paths.ensureProjectWorkspace(userId, projectId)
          : (await this.paths.ensureForUser(userId)).workspace;
        const binary = this.config.getOrThrow<string>('codex.binary');
        const sandbox = this.config.getOrThrow<string>('codex.sandbox');
        const timeoutMs = this.config.getOrThrow<number>('codex.runTimeoutMs');

        const args = ['exec', '--json', '--cd', workspace, '--sandbox', sandbox, '--skip-git-repo-check'];
        if (resumeSessionId) args.push('--resume', resumeSessionId);
        args.push(prompt);

        const proc = spawn(binary, args, {
          env: { ...process.env, CODEX_HOME: user.codexHomeDir },
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        child = proc;
        entry = this.registry.attach(userId, proc);

        const timer = setTimeout(() => {
          this.logger.warn(`codex exec timed out for user ${userId}`);
          subscriber.next({
            type: 'connection.error',
            message: `Codex run timed out after ${timeoutMs}ms`,
          });
          if (proc.exitCode === null) proc.kill('SIGTERM');
          subscriber.complete();
        }, timeoutMs);
        timer.unref();

        let stdoutBuf = '';
        proc.stdout?.on('data', (chunk: Buffer) => {
          stdoutBuf += chunk.toString('utf8');
          let nl: number;
          while ((nl = stdoutBuf.indexOf('\n')) >= 0) {
            const line = stdoutBuf.slice(0, nl).trim();
            stdoutBuf = stdoutBuf.slice(nl + 1);
            if (!line) continue;
            try {
              const event = JSON.parse(line) as Record<string, unknown>;
              this.logger.debug(`[codex exec event] ${line.slice(0, 500)}`);
              subscriber.next({ type: 'codex', event });
            } catch {
              this.logger.warn(`Non-JSON line from codex: ${line.slice(0, 200)}`);
            }
          }
        });

        // Codex streams progress to stderr; useful for logs but not the
        // event channel. Keep last ~2KB for error reporting.
        let stderrTail = '';
        proc.stderr?.on('data', (chunk: Buffer) => {
          stderrTail = (stderrTail + chunk.toString('utf8')).slice(-2048);
        });

        proc.on('error', (err: Error) => {
          clearTimeout(timer);
          this.logger.error(`codex exec spawn error: ${err.message}`);
          subscriber.next({
            type: 'connection.error',
            message: `Failed to launch codex: ${err.message}`,
          });
          subscriber.complete();
        });

        proc.on('exit', (code) => {
          clearTimeout(timer);
          if (code !== 0 && stderrTail.trim()) {
            subscriber.next({
              type: 'connection.error',
              message: stderrTail.trim().slice(-500),
            });
          }
          subscriber.next({ type: 'connection.done', exitCode: code });
          subscriber.complete();
        });
      };

      run().catch((err: Error) => {
        if (err instanceof UnauthorizedException) {
          subscriber.error(err);
          return;
        }
        this.logger.error(`codex run failed: ${err.message}`);
        subscriber.next({
          type: 'connection.error',
          message: err.message,
        });
        subscriber.complete();
      });
    });
  }

  /** Legacy one-shot skill runner; flattens Codex JSONL to plain token deltas. */
  runSkill(userId: string, systemPrompt: string, userInput: string): Observable<SkillStreamPart> {
    const prompt = `${systemPrompt}\n\n---\n\nUser request:\n${userInput}`;
    return new Observable<SkillStreamPart>((subscriber) => {
      let accumulated = '';
      let tokenUsage: number | null = null;

      const inner = this.run(userId, prompt).subscribe({
        next: (evt) => {
          if (evt.type === 'codex') {
            const delta = extractAgentTextDelta(evt.event, accumulated);
            if (delta) {
              accumulated += delta;
              subscriber.next({ kind: 'token', text: delta });
            }
            const usage = extractTokenUsage(evt.event);
            if (usage !== null) tokenUsage = usage;
          } else if (evt.type === 'connection.error') {
            subscriber.next({ kind: 'error', message: evt.message });
          } else if (evt.type === 'connection.done') {
            if (evt.exitCode === 0) {
              subscriber.next({ kind: 'done', fullText: accumulated, tokenUsage });
            } else if (accumulated) {
              // Process exited non-zero but we already collected output — surface it.
              subscriber.next({ kind: 'done', fullText: accumulated, tokenUsage });
            } else {
              subscriber.next({
                kind: 'error',
                message: `Codex exited with code ${evt.exitCode ?? 'null'} before producing any output`,
              });
            }
            subscriber.complete();
          }
        },
        error: (err: Error) => subscriber.error(err),
      });

      return () => inner.unsubscribe();
    });
  }

  /**
   * Chat turn. If `codexSessionId` is provided, resumes the prior Codex
   * session so context is preserved without replaying the transcript.
   * Otherwise issues a fresh `codex exec` with the full system + transcript
   * + new user message as a single prompt.
   *
   * Emits structured events (reasoning / tool calls / file changes /
   * assistant text deltas / final usage) so the UI can render a chat-style
   * timeline rather than a single text blob.
   */
  streamChat(args: {
    userId: string;
    projectId?: string;
    systemPrompt: string;
    transcript: Array<{ role: 'user' | 'assistant'; content: string }>;
    newUserMessage: string;
    codexSessionId: string | null;
  }): Observable<ChatStreamPart> {
    const prompt = args.codexSessionId
      ? args.newUserMessage
      : buildInitialPrompt(args.systemPrompt, args.transcript, args.newUserMessage);

    return new Observable<ChatStreamPart>((subscriber) => {
      let assistantText = '';
      let tokenUsage: number | null = null;
      let sessionIdEmitted = false;

      const inner = this.run(
        args.userId,
        prompt,
        args.codexSessionId ?? undefined,
        args.projectId,
      ).subscribe({
        next: (evt) => {
          if (evt.type === 'codex') {
            for (const part of mapCodexEventToChatParts(evt.event, assistantText)) {
              if (part.kind === 'session-id') {
                if (sessionIdEmitted) continue;
                sessionIdEmitted = true;
              }
              if (part.kind === 'assistant.delta') {
                assistantText += part.text;
              }
              if (part.kind === 'usage') {
                tokenUsage = part.tokens;
              }
              subscriber.next(part);
            }
          } else if (evt.type === 'connection.error') {
            subscriber.next({ kind: 'error', message: evt.message });
          } else if (evt.type === 'connection.done') {
            if (evt.exitCode === 0 || assistantText.length > 0) {
              subscriber.next({ kind: 'done', fullText: assistantText, tokenUsage });
            } else {
              subscriber.next({
                kind: 'error',
                message: `Codex exited with code ${evt.exitCode ?? 'null'} before producing any output`,
              });
            }
            subscriber.complete();
          }
        },
        error: (err: Error) => subscriber.error(err),
      });

      return () => inner.unsubscribe();
    });
  }
}

