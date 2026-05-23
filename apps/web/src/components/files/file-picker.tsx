'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { FileNode } from '@laws/shared';
import { Button } from '@/components/ui/button';
import { listFileTree } from '@/lib/files';
import { cn } from '@/lib/cn';

interface Props {
  projectId: string;
  open: boolean;
  initial?: string[];
  /** Hard cap. Selecting beyond this is silently ignored. */
  maxItems?: number;
  onClose: () => void;
  onConfirm: (paths: string[]) => void;
}

/**
 * Multi-select tree dialog for attaching workspace files/folders to a chat
 * message. Reuses the same backend tree endpoint as FilesTab; renders a
 * lighter, checkbox-driven tree with no rename/delete affordances.
 */
export function FilePicker({
  projectId,
  open,
  initial = [],
  maxItems = 10,
  onClose,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initial));
  const [filter, setFilter] = useState('');

  const tree = useQuery({
    queryKey: ['file-tree', projectId],
    queryFn: () => listFileTree(projectId),
    enabled: open,
  });

  useEffect(() => {
    if (open) setSelected(new Set(initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const filtered = useMemo(
    () => (tree.data ? filterTree(tree.data.root, filter) : null),
    [tree.data, filter],
  );

  if (!open) return null;

  const toggle = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else if (next.size < maxItems) next.add(path);
      return next;
    });
  };

  const confirm = () => {
    onConfirm(Array.from(selected));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink-900)]/55 backdrop-blur-sm px-4 py-8 paper-fade-up"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-[8px] border border-[var(--color-paper-200)] bg-[var(--color-paper-0)] shadow-[var(--shadow-paper-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-[var(--color-paper-200)] px-6 py-4">
          <h3
            className="font-serif text-[20px] tracking-[-0.015em] text-[var(--color-ink-900)]"
            style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 28, 'wght' 520" }}
          >
            Đính kèm tệp
          </h3>
          <p className="mt-1 text-[12.5px] text-[var(--color-ink-500)]">
            Chọn tệp hoặc thư mục trong workspace của dự án để gửi cùng câu hỏi. Codex sẽ
            đọc các tệp này khi trả lời.
          </p>
        </header>

        <div className="border-b border-[var(--color-paper-200)] px-6 py-3">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Lọc tệp…"
            className="block w-full rounded-[5px] border border-[var(--color-paper-300)] bg-[var(--color-paper-50)] px-3 py-1.5 text-[13px] text-[var(--color-ink-900)] outline-none placeholder:text-[var(--color-ink-400)] focus:border-[var(--color-accent-500)] focus:ring-[2.5px] focus:ring-[var(--color-accent-500)]/15"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {tree.isLoading ? (
            <div className="px-3 py-3 text-[12.5px] text-[var(--color-ink-500)]">Đang tải…</div>
          ) : !filtered || (filtered.children ?? []).length === 0 ? (
            <div className="px-3 py-6 text-center text-[12.5px] text-[var(--color-ink-500)]">
              {filter ? 'Không có tệp nào khớp.' : 'Workspace trống — tạo tệp ở tab Tài liệu trước.'}
            </div>
          ) : (
            <PickerTree
              nodes={filtered.children ?? []}
              depth={0}
              selected={selected}
              onToggle={toggle}
              maxReached={selected.size >= maxItems}
            />
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-[var(--color-paper-200)] bg-[var(--color-paper-50)] px-6 py-3.5">
          <div className="text-[11.5px] tracking-[0.04em] uppercase text-[var(--color-ink-500)]">
            Đã chọn {selected.size}/{maxItems}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button size="sm" onClick={confirm} disabled={selected.size === 0}>
              Đính kèm ({selected.size})
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function PickerTree({
  nodes,
  depth,
  selected,
  onToggle,
  maxReached,
}: {
  nodes: FileNode[];
  depth: number;
  selected: Set<string>;
  onToggle: (path: string) => void;
  maxReached: boolean;
}) {
  return (
    <ul>
      {nodes.map((node) => (
        <PickerRow
          key={node.path}
          node={node}
          depth={depth}
          selected={selected}
          onToggle={onToggle}
          maxReached={maxReached}
        />
      ))}
    </ul>
  );
}

function PickerRow({
  node,
  depth,
  selected,
  onToggle,
  maxReached,
}: {
  node: FileNode;
  depth: number;
  selected: Set<string>;
  onToggle: (path: string) => void;
  maxReached: boolean;
}) {
  const [open, setOpen] = useState(depth < 1);
  const isSelected = selected.has(node.path);
  const disabled = !isSelected && maxReached;

  return (
    <li>
      <label
        className={cn(
          'flex items-center gap-2 rounded-[5px] py-1 px-2 transition-colors',
          isSelected ? 'bg-[var(--color-accent-500)]/8' : 'hover:bg-[var(--color-paper-100)]',
          disabled ? 'opacity-50' : '',
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {node.kind === 'folder' ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setOpen((v) => !v);
            }}
            className="text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)]"
            aria-label={open ? 'Thu gọn' : 'Mở rộng'}
          >
            <Chevron open={open} />
          </button>
        ) : (
          <span className="w-3" aria-hidden />
        )}
        <input
          type="checkbox"
          checked={isSelected}
          disabled={disabled}
          onChange={() => onToggle(node.path)}
          className="h-3.5 w-3.5 cursor-pointer accent-[var(--color-accent-500)]"
        />
        {node.kind === 'folder' ? <FolderGlyph /> : <FileGlyph />}
        <span className="flex-1 truncate text-[13px] text-[var(--color-ink-800)]">{node.name}</span>
        {node.kind === 'file' && node.size !== null ? (
          <span className="text-[10.5px] tabular text-[var(--color-ink-400)]">
            {formatBytes(node.size)}
          </span>
        ) : null}
      </label>
      {node.kind === 'folder' && open ? (
        <PickerTree
          nodes={node.children ?? []}
          depth={depth + 1}
          selected={selected}
          onToggle={onToggle}
          maxReached={maxReached}
        />
      ) : null}
    </li>
  );
}

function filterTree(root: FileNode, q: string): FileNode {
  const term = q.trim().toLowerCase();
  if (!term) return root;
  const visit = (node: FileNode): FileNode | null => {
    if (node.kind === 'file') {
      return node.name.toLowerCase().includes(term) ? node : null;
    }
    const matchedSelf = node.name.toLowerCase().includes(term);
    const kept = (node.children ?? [])
      .map(visit)
      .filter((x): x is FileNode => x !== null);
    if (matchedSelf || kept.length > 0) return { ...node, children: kept };
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
      className={cn('h-3 w-3 transition-transform', open ? 'rotate-90' : '')}
      fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function FolderGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--color-brass-500)]" fill="currentColor" aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

function FileGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--color-ink-400)]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
