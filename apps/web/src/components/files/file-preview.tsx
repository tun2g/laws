'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { FileNode } from '@laws/shared';
import { Button } from '@/components/ui/button';
import {
  downloadFile,
  readFileContent,
  saveFileContent,
} from '@/lib/files';
import { readableError } from '@/lib/api';

interface Props {
  projectId: string;
  node: FileNode;
}

type State =
  | { kind: 'loading' }
  | { kind: 'text'; content: string; modifiedAt: string; size: number }
  | { kind: 'binary'; reason: string };

export function FilePreview({ projectId, node }: Props) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [edited, setEdited] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (node.kind === 'folder') return;
    let cancelled = false;
    setState({ kind: 'loading' });
    setEdited(null);
    readFileContent(projectId, node.path)
      .then((res) => {
        if (cancelled) return;
        setState({
          kind: 'text',
          content: res.content,
          modifiedAt: res.modifiedAt,
          size: res.size,
        });
      })
      .catch((err: { response?: { data?: { message?: string } } }) => {
        if (cancelled) return;
        const message = err.response?.data?.message ?? 'Không xem được tệp';
        setState({ kind: 'binary', reason: message });
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, node.path]);

  if (node.kind === 'folder') {
    const childCount = node.children?.length ?? 0;
    return (
      <div className="flex h-full flex-col">
        <header className="border-b border-paper-200 px-5 py-3">
          <Breadcrumbs path={node.path} />
          <div className="mt-0.5 text-[11px] uppercase tracking-[0.04em] text-ink-500">
            Thư mục · {childCount} mục
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center px-5 py-10 text-center">
          <div>
            <p
              className="font-serif text-[18px] tracking-[-0.01em] text-ink-800"
              style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 28, 'wght' 480" }}
            >
              {node.name}
            </p>
            <p className="mt-1.5 text-[12.5px] text-ink-500">
              Kéo tệp vào thư mục này, hoặc dùng nút <span className="font-medium">+ Tệp</span> để tạo mới bên trong.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const dirty = edited !== null && state.kind === 'text' && edited !== state.content;

  const onSave = async () => {
    if (edited === null) return;
    setSaving(true);
    try {
      const next = await saveFileContent(projectId, node.path, edited);
      setState({ kind: 'text', content: next.content, modifiedAt: next.modifiedAt, size: next.size });
      setEdited(null);
      toast.success('Đã lưu');
    } catch (err) {
      toast.error(readableError(err, 'Lưu thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const onDownload = async () => {
    try {
      await downloadFile(projectId, node.path, node.name);
    } catch (err) {
      toast.error(readableError(err, 'Tải xuống thất bại'));
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between gap-3 border-b border-[var(--color-paper-200)] px-5 py-3">
        <div className="min-w-0">
          <Breadcrumbs path={node.path} />

          <div className="mt-0.5 text-[11px] uppercase tracking-[0.04em] text-[var(--color-ink-500)]">
            {state.kind === 'text'
              ? `${formatBytes(state.size)} · ${new Date(state.modifiedAt).toLocaleString('vi-VN')}`
              : node.kind === 'file' && node.size !== null
                ? `${formatBytes(node.size)} · ${new Date(node.modifiedAt).toLocaleString('vi-VN')}`
                : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onDownload}>
            Tải xuống
          </Button>
          {state.kind === 'text' ? (
            <Button size="sm" onClick={onSave} loading={saving} disabled={!dirty}>
              {dirty ? 'Lưu thay đổi' : 'Đã lưu'}
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {state.kind === 'loading' ? (
          <div className="px-5 py-6 text-[13px] text-[var(--color-ink-500)]">Đang tải…</div>
        ) : state.kind === 'binary' ? (
          <div className="px-5 py-8 text-center">
            <p className="font-serif text-[18px] text-[var(--color-ink-800)] tracking-[-0.01em]" style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 28, 'wght' 480" }}>
              Tệp nhị phân
            </p>
            <p className="mt-1 text-[12.5px] text-[var(--color-ink-500)]">{state.reason}</p>
            <Button className="mt-4" size="sm" onClick={onDownload}>
              Tải xuống tệp gốc
            </Button>
          </div>
        ) : (
          <textarea
            ref={composerRef}
            value={edited ?? state.content}
            onChange={(e) => setEdited(e.target.value)}
            spellCheck={false}
            className="h-full w-full resize-none border-0 bg-[var(--color-paper-50)]/40 px-5 py-4 font-mono text-[13px] leading-[1.55] text-[var(--color-ink-900)] outline-none"
          />
        )}
      </div>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Render the path as clickable-looking breadcrumbs with "›" separators. */
function Breadcrumbs({ path }: { path: string }) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) {
    return <div className="truncate font-mono text-[13px] text-[var(--color-ink-900)]">{path}</div>;
  }
  const last = parts[parts.length - 1]!;
  const prefix = parts.slice(0, -1);
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
      {prefix.map((seg, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 text-[var(--color-ink-500)]">
          <span className="truncate font-mono">{seg}</span>
          <span aria-hidden className="text-[var(--color-ink-300)]">
            ›
          </span>
        </span>
      ))}
      <span className="truncate font-mono font-medium text-[var(--color-ink-900)]">{last}</span>
    </div>
  );
}
