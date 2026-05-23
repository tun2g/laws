'use client';

import Link from 'next/link';
import type { ChatSession } from '@laws/shared';
import { Button } from '@/components/ui/button';

const KIND_LABEL: Record<string, string> = {
  research: 'Tra cứu',
  review: 'Rà soát',
  translate: 'Dịch',
  'dual-lang': 'Song ngữ',
  free: 'Tự do',
};

export function ChatHeader({
  projectId,
  session,
  onDelete,
}: {
  projectId: string;
  session: ChatSession | null;
  onDelete: () => void;
}) {
  return (
    <header className="flex items-end justify-between gap-4 border-b border-[var(--color-paper-200)] pb-5">
      <div className="min-w-0">
        <Link
          href={`/projects/${projectId}` as never}
          className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)] transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
          Về dự án
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span className="overline">
            {KIND_LABEL[session?.kind ?? 'free'] ?? session?.kind ?? '—'}
          </span>
          <span aria-hidden className="h-px w-8 bg-[var(--color-paper-300)]" />
          <span className="overline">
            {session?.codexSessionId ? 'Tiếp nối ngữ cảnh' : 'Phiên mới'}
          </span>
        </div>
        <h1
          className="mt-1 truncate font-serif text-[26px] text-[var(--color-ink-900)] tracking-[-0.02em]"
          style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 60, 'wght' 500" }}
        >
          {session?.title ?? 'Đang tải…'}
        </h1>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
        Xóa phiên
      </Button>
    </header>
  );
}
