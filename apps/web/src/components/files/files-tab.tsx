'use client';

import { useCallback, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { FileNode, FileNodeKind } from '@laws/shared';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FileTree, type PendingCreate } from './file-tree';
import { FilePreview } from './file-preview';
import {
  EmptyPreview,
  FolderPlusIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  ToolbarButton,
  UploadIcon,
} from './file-tree-icons';
import {
  createFileNode,
  deleteFileNode,
  downloadFile,
  listFileTree,
  moveFileNode,
  uploadFile,
} from '@/lib/files';
import { readableError } from '@/lib/api';
import { cn } from '@/lib/cn';

export function FilesTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<FileNode | null>(null);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [pendingCreate, setPendingCreate] = useState<PendingCreate | null>(null);
  const [filter, setFilter] = useState('');
  const [pendingDelete, setPendingDelete] = useState<FileNode | null>(null);
  const [dropping, setDropping] = useState(false);

  const tree = useQuery({
    queryKey: ['file-tree', projectId],
    queryFn: () => listFileTree(projectId),
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['file-tree', projectId] });
  }, [qc, projectId]);

  const startCreate = (kind: FileNodeKind) => {
    const parentPath =
      selected?.kind === 'folder' ? selected.path : selected ? parentOf(selected.path) : '';
    setPendingCreate({ parentPath, kind });
  };

  const commitCreate = async (parentPath: string, kind: FileNodeKind, name: string) => {
    setPendingCreate(null);
    const full = parentPath ? `${parentPath}/${name}` : name;
    try {
      await createFileNode(projectId, { kind, path: full, content: '' });
      toast.success(kind === 'folder' ? 'Đã tạo thư mục' : 'Đã tạo tệp');
      invalidate();
    } catch (err) {
      toast.error(readableError(err, kind === 'folder' ? 'Tạo thư mục thất bại' : 'Tạo tệp thất bại'));
    }
  };

  const commitRename = async (node: FileNode, newName: string) => {
    setEditingPath(null);
    const target = parentOf(node.path) === '' ? newName : `${parentOf(node.path)}/${newName}`;
    try {
      await moveFileNode(projectId, node.path, target);
      if (selected?.path === node.path) {
        setSelected({ ...node, path: target, name: newName });
      }
      toast.success('Đã đổi tên');
      invalidate();
    } catch (err) {
      toast.error(readableError(err, 'Đổi tên thất bại'));
    }
  };

  const onContextAction = (node: FileNode, action: 'rename' | 'delete' | 'download') => {
    if (action === 'rename') setEditingPath(node.path);
    else if (action === 'delete') setPendingDelete(node);
    else if (action === 'download') void doDownload(node);
  };

  const doDownload = async (node: FileNode) => {
    try {
      await downloadFile(projectId, node.path, node.name);
    } catch (err) {
      toast.error(readableError(err, 'Tải xuống thất bại'));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const node = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteFileNode(projectId, node.path);
      if (selected?.path === node.path) setSelected(null);
      toast.success('Đã xóa');
      invalidate();
    } catch (err) {
      toast.error(readableError(err, 'Xóa thất bại'));
    }
  };

  const targetDirForUpload = (): string => {
    if (selected?.kind === 'folder') return selected.path;
    if (selected) return parentOf(selected.path);
    return '';
  };

  const uploadOne = async (file: File) => {
    try {
      await uploadFile(projectId, file, targetDirForUpload());
      toast.success(`Đã tải lên ${file.name}`);
      invalidate();
    } catch (err) {
      toast.error(readableError(err, 'Tải lên thất bại'));
    }
  };

  const onUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const f of files) await uploadOne(f);
    e.target.value = '';
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDropping(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    for (const f of files) await uploadOne(f);
  };

  return (
    <div className="grid grid-cols-[300px_1fr] gap-0 rounded-[8px] border border-[var(--color-paper-200)] bg-[var(--color-paper-0)] overflow-hidden h-[calc(100vh-15rem)]">
      <aside className="flex flex-col border-r border-[var(--color-paper-200)]">
        <div className="flex items-center gap-1 border-b border-[var(--color-paper-200)] px-3 py-2">
          <ToolbarButton onClick={() => startCreate('file')} title="Tệp mới">
            <PlusIcon /> Tệp
          </ToolbarButton>
          <ToolbarButton onClick={() => startCreate('folder')} title="Thư mục mới">
            <FolderPlusIcon /> Thư mục
          </ToolbarButton>
          <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Tải lên">
            <UploadIcon /> Tải lên
          </ToolbarButton>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onUploadChange} />
          <button
            type="button"
            onClick={() => invalidate()}
            className="ml-auto rounded p-1 text-[var(--color-ink-500)] hover:bg-[var(--color-paper-100)] hover:text-[var(--color-ink-900)]"
            aria-label="Làm mới"
            title="Làm mới"
          >
            <RefreshIcon />
          </button>
        </div>

        <div className="border-b border-[var(--color-paper-200)] px-3 py-2">
          <div className="relative">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Lọc tệp…"
              className="block w-full rounded-[5px] border border-[var(--color-paper-300)] bg-[var(--color-paper-50)] pl-7 pr-2 py-1 text-[12.5px] text-[var(--color-ink-900)] outline-none placeholder:text-[var(--color-ink-400)] focus:border-[var(--color-accent-500)] focus:ring-[2.5px] focus:ring-[var(--color-accent-500)]/15"
            />
            <span aria-hidden className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-ink-400)]">
              <SearchIcon />
            </span>
          </div>
        </div>

        <div
          className={cn(
            'flex-1 overflow-y-auto px-1.5 py-2 relative transition-colors',
            dropping ? 'bg-[var(--color-accent-500)]/8 ring-2 ring-inset ring-[var(--color-accent-500)]/40' : '',
          )}
          onDragOver={(e) => {
            e.preventDefault();
            if (!dropping) setDropping(true);
          }}
          onDragLeave={(e) => {
            if (e.currentTarget === e.target) setDropping(false);
          }}
          onDrop={onDrop}
        >
          {tree.isLoading ? (
            <div className="px-2 py-3 text-[12.5px] text-[var(--color-ink-500)]">Đang tải…</div>
          ) : tree.isError ? (
            <div className="px-2 py-3 text-[12.5px] text-[var(--color-lacquer-500)]">
              Lỗi tải cây thư mục.
            </div>
          ) : tree.data ? (
            <FileTree
              root={tree.data.root}
              selectedPath={selected?.path ?? null}
              editingPath={editingPath}
              pendingCreate={pendingCreate}
              filter={filter}
              onSelect={setSelected}
              onContextAction={onContextAction}
              onCommitRename={commitRename}
              onCancelRename={() => setEditingPath(null)}
              onCommitCreate={commitCreate}
              onCancelCreate={() => setPendingCreate(null)}
            />
          ) : null}
          {dropping ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-[6px] bg-[var(--color-paper-0)]/90 px-4 py-2 text-[13px] font-medium text-[var(--color-accent-700)] shadow-[var(--shadow-paper)]">
                Thả vào để tải lên
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      <section className="flex flex-col bg-[var(--color-paper-50)]/30">
        {selected ? (
          <FilePreview projectId={projectId} node={selected} />
        ) : (
          <EmptyPreview />
        )}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.kind === 'folder' ? 'Xóa thư mục?' : 'Xóa tệp?'}
        description={
          pendingDelete
            ? `"${pendingDelete.path}" sẽ bị xóa vĩnh viễn${
                pendingDelete.kind === 'folder' ? ' cùng tất cả nội dung bên trong' : ''
              }.`
            : ''
        }
        confirmLabel="Xóa"
        destructive
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}

function parentOf(p: string): string {
  const i = p.lastIndexOf('/');
  return i < 0 ? '' : p.slice(0, i);
}
