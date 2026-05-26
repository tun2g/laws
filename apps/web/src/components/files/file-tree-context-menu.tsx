'use client';

import type { FileNode } from '@laws/shared';
import { cn } from '@/lib/cn';

export type FileNodeAction = 'rename' | 'delete' | 'download';

export function FileTreeContextMenu({
  node,
  onAction,
  onClose,
}: {
  node: FileNode;
  onAction: (a: FileNodeAction) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute z-30 mt-0 ml-12 rounded-[6px] border border-paper-200 bg-paper-0 shadow-[var(--shadow-paper-lg)] py-1 min-w-[150px]">
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
          ? 'text-lacquer-500 hover:bg-lacquer-50'
          : 'text-ink-700 hover:bg-paper-100',
      )}
    >
      {children}
    </button>
  );
}
