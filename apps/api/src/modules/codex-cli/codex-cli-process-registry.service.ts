import { Injectable, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ChildProcess } from 'node:child_process';

type Entry = { child: ChildProcess; startedAt: number };

/**
 * Tracks active codex child processes so we can enforce concurrency caps and
 * kill them on disconnect/timeout. In-memory only — fine for a single API
 * pod; if we ever scale horizontally this needs Redis-backed coordination.
 */
@Injectable()
export class CodexCliProcessRegistry {
  private readonly byUser = new Map<string, Set<Entry>>();
  private total = 0;

  constructor(private readonly config: ConfigService) {}

  reserve(userId: string): void {
    const perUserCap = this.config.getOrThrow<number>('codex.maxConcurrentPerUser');
    const globalCap = this.config.getOrThrow<number>('codex.maxConcurrent');

    if (this.total >= globalCap) {
      throw new ServiceUnavailableException(
        `Codex is at capacity (${globalCap} concurrent runs). Try again shortly.`,
      );
    }
    const userCount = this.byUser.get(userId)?.size ?? 0;
    if (userCount >= perUserCap) {
      throw new ConflictException(
        `You already have ${userCount} Codex run(s) in progress. Wait for it to finish.`,
      );
    }
  }

  attach(userId: string, child: ChildProcess): Entry {
    const entry: Entry = { child, startedAt: Date.now() };
    let set = this.byUser.get(userId);
    if (!set) {
      set = new Set();
      this.byUser.set(userId, set);
    }
    set.add(entry);
    this.total += 1;
    return entry;
  }

  release(userId: string, entry: Entry): void {
    const set = this.byUser.get(userId);
    if (set?.delete(entry)) {
      this.total -= 1;
      if (set.size === 0) this.byUser.delete(userId);
    }
  }

  killAllForUser(userId: string): void {
    const set = this.byUser.get(userId);
    if (!set) return;
    for (const entry of set) {
      this.tryKill(entry.child);
    }
  }

  activeCountForUser(userId: string): number {
    return this.byUser.get(userId)?.size ?? 0;
  }

  maxConcurrent(): number {
    return this.config.getOrThrow<number>('codex.maxConcurrent');
  }

  maxConcurrentPerUser(): number {
    return this.config.getOrThrow<number>('codex.maxConcurrentPerUser');
  }

  private tryKill(child: ChildProcess): void {
    if (child.exitCode !== null) return;
    child.kill('SIGTERM');
    setTimeout(() => {
      if (child.exitCode === null) child.kill('SIGKILL');
    }, 5_000).unref();
  }
}
