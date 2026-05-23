import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as path from 'node:path';
import { FORBIDDEN_PATH_SEGMENTS, HIDDEN_DIRS } from '../constants/files.constants';

/**
 * Resolve a user-supplied relative path against the project's workspace
 * root, with three defenses:
 *   1. Reject empty / `.` / `..` segments and any leading slash (no escape).
 *   2. After path.resolve, require the result to remain inside the root.
 *   3. Reject any path that crosses a hidden directory (e.g. `.codex/foo`).
 *
 * Returns the absolute path. Throws BadRequest/Forbidden on violations.
 */
export function safeResolvePath(workspaceRoot: string, relativePath: string): string {
  if (typeof relativePath !== 'string') {
    throw new BadRequestException('Đường dẫn không hợp lệ');
  }
  // Strip leading "./" or "/" — accept the more lenient form.
  const cleaned = relativePath.replace(/^\.\//, '').replace(/^\/+/, '').trim();
  if (cleaned === '' || cleaned === '.') {
    // Empty path means "the root itself" — caller handles that, return root.
    return path.resolve(workspaceRoot);
  }

  if (cleaned.includes('\0')) {
    throw new BadRequestException('Đường dẫn không hợp lệ');
  }

  const segments = cleaned.split('/');
  for (const seg of segments) {
    if (FORBIDDEN_PATH_SEGMENTS.has(seg)) {
      throw new BadRequestException('Đường dẫn không hợp lệ');
    }
    if (HIDDEN_DIRS.has(seg)) {
      throw new ForbiddenException('Không thể thao tác trên thư mục hệ thống');
    }
  }

  const rootAbs = path.resolve(workspaceRoot);
  const resolved = path.resolve(rootAbs, cleaned);
  if (resolved !== rootAbs && !resolved.startsWith(rootAbs + path.sep)) {
    throw new ForbiddenException('Đường dẫn vượt ra ngoài thư mục dự án');
  }
  return resolved;
}

/** Compute the path relative to the workspace root for response payloads. */
export function relativeFromRoot(workspaceRoot: string, absPath: string): string {
  const rel = path.relative(path.resolve(workspaceRoot), absPath);
  return rel.split(path.sep).join('/');
}
