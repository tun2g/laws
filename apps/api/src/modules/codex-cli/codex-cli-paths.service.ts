import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, chmod, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

/**
 * Owns the on-disk layout for per-user Codex isolation. Two roots:
 *  - CODEX_HOME_ROOT/<userId>                 ← auth.json + config.toml
 *  - CODEX_WORKSPACE_ROOT/<userId>            ← user-level workspace root
 *  - CODEX_WORKSPACE_ROOT/<userId>/<projId>   ← per-project workspace (chat --cd target)
 *
 * The ids are UUIDs from JWT / DB so traversal is unlikely, but every path
 * goes through `pinned` (resolve + startsWith) as defense in depth.
 */
@Injectable()
export class CodexCliPathsService {
  constructor(private readonly config: ConfigService) {}

  homeDirFor(userId: string): string {
    return this.pinned(this.config.getOrThrow<string>('codex.homeRoot'), [userId]);
  }

  workspaceDirFor(userId: string): string {
    return this.pinned(this.config.getOrThrow<string>('codex.workspaceRoot'), [userId]);
  }

  workspaceDirForProject(userId: string, projectId: string): string {
    return this.pinned(this.config.getOrThrow<string>('codex.workspaceRoot'), [
      userId,
      projectId,
    ]);
  }

  /** Create user-level home + workspace dirs (idempotent). */
  async ensureForUser(userId: string): Promise<{ home: string; workspace: string }> {
    const home = this.homeDirFor(userId);
    const workspace = this.workspaceDirFor(userId);
    await mkdir(home, { recursive: true, mode: 0o700 });
    await mkdir(workspace, { recursive: true, mode: 0o700 });
    await chmod(home, 0o700);
    await chmod(workspace, 0o700);
    return { home, workspace };
  }

  /** Create per-project workspace dir on demand (idempotent). */
  async ensureProjectWorkspace(userId: string, projectId: string): Promise<string> {
    await this.ensureForUser(userId);
    const dir = this.workspaceDirForProject(userId, projectId);
    await mkdir(dir, { recursive: true, mode: 0o700 });
    await chmod(dir, 0o700);
    return dir;
  }

  /** Wipe a user's CODEX_HOME (auth + config). Workspace files survive. */
  async wipeHome(userId: string): Promise<void> {
    const home = this.homeDirFor(userId);
    if (existsSync(home)) {
      await rm(home, { recursive: true, force: true });
    }
  }

  private pinned(root: string, segments: string[]): string {
    const resolvedRoot = path.resolve(root);
    const candidate = path.resolve(resolvedRoot, ...segments);
    if (!candidate.startsWith(resolvedRoot + path.sep)) {
      throw new Error(`Refusing path outside configured root: ${candidate}`);
    }
    return candidate;
  }
}
