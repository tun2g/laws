'use client';

import { useState } from 'react';
import type { FileNode, FileNodeKind } from '@laws/shared';
import { cn } from '@/lib/cn';
import { InlineNameInput } from './inline-name-input';
import {
  TreeChevron as Chevron,
  TreeFileIcon as FileIcon,
  TreeFolderIcon as FolderIcon,
  TreeKebabIcon as KebabIcon,
} from './file-tree-icons';
import { FileTreeContextMenu } from './file-tree-context-menu';

export interface PendingCreate {
  parentPath: string;
  kind: FileNodeKind;
}

/** Custom drag MIME so internal row drags don't collide with native file uploads. */
const DRAG_MIME = 'application/x-laws-path';

interface Props {
  root: FileNode;
  selectedPath: string | null;
  /** Path of the node currently being renamed (null = none). */
  editingPath: string | null;
  /** Where to render the inline "new node" input (null = none). */
  pendingCreate: PendingCreate | null;
  /** Case-insensitive filter; empty string = no filter. */
  filter: string;
  onSelect: (node: FileNode) => void;
  onContextAction: (node: FileNode, action: 'rename' | 'delete' | 'download') => void;
  onCommitRename: (node: FileNode, newName: string) => void;
  onCancelRename: () => void;
  onCommitCreate: (parentPath: string, kind: FileNodeKind, name: string) => void;
  onCancelCreate: () => void;
  /** Move `from` into `toParent` (empty string = root). */
  onMoveTo: (from: string, toParent: string) => void;
}

export function FileTree(props: Props) {
  const filtered = filterTree(props.root, props.filter);
  const [rootDragOver, setRootDragOver] = useState(false);

  const acceptsInternalDrag = (e: React.DragEvent) =>
    e.dataTransfer.types.includes(DRAG_MIME);

  return (
    <ul
      className={cn(
        'text-[13px] text-ink-800 rounded-[5px] transition-colors',
        rootDragOver ? 'bg-accent-500/8 ring-1 ring-inset ring-accent-500/35' : '',
      )}
      onDragOver={(e) => {
        if (!acceptsInternalDrag(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!rootDragOver) setRootDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setRootDragOver(false);
      }}
      onDrop={(e) => {
        if (!acceptsInternalDrag(e)) return;
        e.preventDefault();
        e.stopPropagation();
        setRootDragOver(false);
        const from = e.dataTransfer.getData(DRAG_MIME);
        if (from) props.onMoveTo(from, '');
      }}
    >
      {props.pendingCreate?.parentPath === '' ? (
        <PendingCreateRow {...props} depth={0} />
      ) : null}
      {(filtered.children ?? []).map((child) => (
        <TreeRow key={child.path} node={child} depth={0} {...props} />
      ))}
      {(filtered.children ?? []).length === 0 && !props.pendingCreate ? (
        <li className="px-2 py-3 text-[12.5px] italic text-ink-400">
          {props.filter
            ? 'Không có tệp nào khớp.'
            : 'Thư mục trống — tạo tệp/thư mục mới phía trên.'}
        </li>
      ) : null}
    </ul>
  );
}

function PendingCreateRow(props: Props & { depth: number }) {
  if (!props.pendingCreate) return null;
  const { kind } = props.pendingCreate;
  return (
    <li>
      <div
        className="flex items-center gap-1 rounded-[5px] py-1 pl-2 pr-1"
        style={{ paddingLeft: `${8 + props.depth * 16}px` }}
      >
        <span className="w-3" aria-hidden />
        {kind === 'folder' ? <FolderIcon open={false} /> : <FileIcon />}
        <InlineNameInput
          initial=""
          placeholder={kind === 'folder' ? 'Tên thư mục mới' : 'Tên tệp mới (vd: ghi-chu.md)'}
          onCommit={(name) => props.onCommitCreate(props.pendingCreate!.parentPath, kind, name)}
          onCancel={props.onCancelCreate}
        />
      </div>
    </li>
  );
}

function TreeRow({
  node,
  depth,
  ...props
}: { node: FileNode; depth: number } & Props) {
  const [open, setOpen] = useState(depth < 1 || Boolean(props.filter));
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const isSelected = props.selectedPath === node.path;
  const isEditing = props.editingPath === node.path;
  const isCreatingInside =
    node.kind === 'folder' && props.pendingCreate?.parentPath === node.path;
  const isOpen = open || isCreatingInside;

  const acceptsInternalDrag = (e: React.DragEvent) =>
    e.dataTransfer.types.includes(DRAG_MIME);

  return (
    <li>
      <div
        draggable={!isEditing}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData(DRAG_MIME, node.path);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={(e) => {
          if (node.kind !== 'folder' || !acceptsInternalDrag(e)) return;
          const from = e.dataTransfer.getData(DRAG_MIME);
          if (from && (from === node.path || node.path.startsWith(`${from}/`))) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';
          if (!dragOver) setDragOver(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragOver(false);
        }}
        onDrop={(e) => {
          if (node.kind !== 'folder' || !acceptsInternalDrag(e)) return;
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          const from = e.dataTransfer.getData(DRAG_MIME);
          if (from && from !== node.path) props.onMoveTo(from, node.path);
        }}
        className={cn(
          'group flex items-center gap-1 rounded-[5px] pl-2 pr-1 py-1 transition-colors',
          isEditing ? '' : 'cursor-pointer',
          isSelected && !isEditing
            ? 'bg-accent-500/10 text-accent-700'
            : !isEditing && 'hover:bg-paper-100',
          dragOver ? 'bg-accent-500/15 ring-1 ring-accent-500/45' : '',
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => {
          if (isEditing) return;
          props.onSelect(node);
          if (node.kind === 'folder') setOpen((v) => !v);
        }}
      >
        {node.kind === 'folder' ? <Chevron open={isOpen} /> : <span className="w-3" aria-hidden />}
        {node.kind === 'folder' ? <FolderIcon open={isOpen} /> : <FileIcon />}
        {isEditing ? (
          <InlineNameInput
            initial={node.name}
            selectName
            onCommit={(name) => props.onCommitRename(node, name)}
            onCancel={props.onCancelRename}
          />
        ) : (
          <>
            <span className="flex-1 truncate">{node.name}</span>
            {node.kind === 'file' && node.size !== null ? (
              <span className="hidden text-[10.5px] tabular text-[var(--color-ink-400)] group-hover:inline">
                {formatBytes(node.size)}
              </span>
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-[var(--color-paper-200)]"
              aria-label="Mở menu"
            >
              <KebabIcon />
            </button>
          </>
        )}
      </div>

      {menuOpen ? (
        <FileTreeContextMenu
          node={node}
          onAction={(a) => {
            setMenuOpen(false);
            props.onContextAction(node, a);
          }}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}

      {node.kind === 'folder' && isOpen ? (
        <ul>
          {isCreatingInside ? <PendingCreateRow {...props} depth={depth + 1} /> : null}
          {(node.children ?? []).map((child) => (
            <TreeRow key={child.path} node={child} depth={depth + 1} {...props} />
          ))}
          {(node.children ?? []).length === 0 && !isCreatingInside ? (
            <li
              className="text-[11.5px] italic text-[var(--color-ink-400)] py-0.5"
              style={{ paddingLeft: `${8 + (depth + 1) * 16 + 18}px` }}
            >
              trống
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

/** Recursively filter by case-insensitive substring on names; keep folders
 *  whose descendants match. */
function filterTree(root: FileNode, q: string): FileNode {
  const term = q.trim().toLowerCase();
  if (!term) return root;
  const visit = (node: FileNode): FileNode | null => {
    if (node.kind === 'file') {
      return node.name.toLowerCase().includes(term) ? node : null;
    }
    const matchedSelf = node.name.toLowerCase().includes(term);
    const keptChildren = (node.children ?? [])
      .map(visit)
      .filter((x): x is FileNode => x !== null);
    if (matchedSelf || keptChildren.length > 0) {
      return { ...node, children: keptChildren };
    }
    return null;
  };
  return visit(root) ?? { ...root, children: [] };
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

