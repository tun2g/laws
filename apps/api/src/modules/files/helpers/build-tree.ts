import { readdir, stat } from 'node:fs/promises';
import * as path from 'node:path';
import type { FileNode } from '@laws/shared';
import { HIDDEN_DIRS } from '../constants/files.constants';
import { relativeFromRoot } from './safe-resolve-path';

/**
 * Recursive directory listing rooted at workspaceRoot. Hidden directories
 * (HIDDEN_DIRS) are silently filtered. Folders sort first, then files;
 * within each kind sort by name (case-insensitive).
 */
export async function buildTree(workspaceRoot: string): Promise<FileNode> {
  return buildNode(workspaceRoot, workspaceRoot);
}

async function buildNode(workspaceRoot: string, absPath: string): Promise<FileNode> {
  const st = await stat(absPath);
  const rel = relativeFromRoot(workspaceRoot, absPath);
  const name = rel === '' ? '' : path.basename(absPath);
  if (st.isDirectory()) {
    const entries = await readdir(absPath, { withFileTypes: true });
    const visible = entries.filter((e) => !HIDDEN_DIRS.has(e.name));
    const children = await Promise.all(
      visible.map((e) => buildNode(workspaceRoot, path.join(absPath, e.name))),
    );
    children.sort(byKindThenName);
    return {
      path: rel,
      name,
      kind: 'folder',
      size: null,
      modifiedAt: st.mtime.toISOString(),
      children,
    };
  }
  return {
    path: rel,
    name,
    kind: 'file',
    size: st.size,
    modifiedAt: st.mtime.toISOString(),
  };
}

function byKindThenName(a: FileNode, b: FileNode): number {
  if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
  return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
}
