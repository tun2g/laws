'use client';

import { useState } from 'react';
import type { FileNode, FileNodeKind } from '@laws/shared';
import { cn } from '@/lib/cn';
import { InlineNameInput } from './inline-name-input';

export interface PendingCreate {
  parentPath: string;
  kind: FileNodeKind;
}

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
}

export function FileTree(props: Props) {
  const filtered = filterTree(props.root, props.filter);
  return (
    <ul className="text-[13px] text-[var(--color-ink-800)]">
      {props.pendingCreate?.parentPath === '' ? (
        <PendingCreateRow {...props} depth={0} />
      ) : null}
      {(filtered.children ?? []).map((child) => (
        <TreeRow key={child.path} node={child} depth={0} {...props} />
      ))}
      {(filtered.children ?? []).length === 0 && !props.pendingCreate ? (
        <li className="px-2 py-3 text-[12.5px] italic text-[var(--color-ink-400)]">
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
  const isSelected = props.selectedPath === node.path;
  const isEditing = props.editingPath === node.path;
  const isCreatingInside =
    node.kind === 'folder' && props.pendingCreate?.parentPath === node.path;
  const isOpen = open || isCreatingInside;

  return (
    <li>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-[5px] pl-2 pr-1 py-1 transition-colors',
          isEditing ? '' : 'cursor-pointer',
          isSelected && !isEditing
            ? 'bg-[var(--color-accent-500)]/10 text-[var(--color-accent-700)]'
            : !isEditing && 'hover:bg-[var(--color-paper-100)]',
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => {
          if (isEditing) return;
          if (node.kind === 'folder') setOpen((v) => !v);
          else props.onSelect(node);
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
        <ContextMenu
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

function ContextMenu({
  node,
  onAction,
  onClose,
}: {
  node: FileNode;
  onAction: (a: 'rename' | 'delete' | 'download') => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute z-30 mt-0 ml-12 rounded-[6px] border border-[var(--color-paper-200)] bg-[var(--color-paper-0)] shadow-[var(--shadow-paper-lg)] py-1 min-w-[150px]">
        <MenuItem onClick={() => onAction('rename')}>Đổi tên</MenuItem>
        {node.kind === 'file' ? (
          <MenuItem onClick={() => onAction('download')}>Tải xuống</MenuItem>
        ) : null}
        <MenuItem danger onClick={() => onAction('delete')}>
          Xóa
        </MenuItem>
      </div>
    </>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'block w-full px-3 py-1.5 text-left text-[12.5px] transition-colors',
        danger
          ? 'text-[var(--color-lacquer-500)] hover:bg-[var(--color-lacquer-50)]'
          : 'text-[var(--color-ink-700)] hover:bg-[var(--color-paper-100)]',
      )}
    >
      {children}
    </button>
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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-3 w-3 text-[var(--color-ink-400)] transition-transform', open ? 'rotate-90' : '')}
      fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--color-brass-500)]" fill="currentColor" aria-hidden>
      {open ? (
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H5l-2 9V7Z" />
      ) : (
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      )}
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--color-ink-400)]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function KebabIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[var(--color-ink-400)]" fill="currentColor" aria-hidden>
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}
