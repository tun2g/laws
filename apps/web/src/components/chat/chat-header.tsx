'use client';

import Link from 'next/link';
import type { ChatSession, ChatSessionKind } from '@laws/shared';

const KIND_LABEL: Record<ChatSessionKind, string> = {
  research: 'Tra cứu',
  review: 'Rà soát',
  translate: 'Dịch',
  'dual-lang': 'Song ngữ',
  free: 'Tự do',
};

function KindGlyph({ kind }: { kind: ChatSessionKind }) {
  const common = {
    viewBox: '0 0 24 24',
    className: 'h-3 w-3',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.8 as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (kind) {
    case 'research':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-4.3-4.3" />
        </svg>
      );
    case 'review':
      return (
        <svg {...common}>
          <path d="M4 5h12l4 4v10H4z" />
          <path d="m8 13 3 3 5-6" />
        </svg>
      );
    case 'translate':
      return (
        <svg {...common}>
          <path d="M4 6h10M9 4v2M5 6c0 5 4 8 8 9" />
          <path d="m13 19 5-10 5 10M15 16h6" />
        </svg>
      );
    case 'dual-lang':
      return (
        <svg {...common}>
          <path d="M3 8h12l-3-3M21 16H9l3 3" />
        </svg>
      );
    case 'free':
    default:
      return (
        <svg {...common}>
          <path d="M16 4 4 16v4h4L20 8z" />
          <path d="m14 6 4 4" />
        </svg>
      );
  }
}

function formatDate(iso?: string) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

export function ChatHeader({
  projectId,
  session,
  onDelete,
}: {
  projectId: string;
  session: ChatSession | null;
  onDelete: () => void;
}) {
  const kind: ChatSessionKind = session?.kind ?? 'free';
  const dateLabel = formatDate(session?.updatedAt);

  return (
    <header className="flex items-start justify-between gap-3 border-b border-paper-200 pb-2.5 pt-0.5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px]">
          <Link
            href={`/projects/${projectId}` as never}
            className="inline-flex items-center gap-1 text-ink-500 hover:text-ink-900 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m15 18-6-6 6-6" />
            </svg>
            Về dự án
          </Link>
          <span aria-hidden className="h-px w-3 bg-paper-300" />
          <span className="inline-flex items-center gap-1 text-ink-500">
            <KindGlyph kind={kind} />
            <span className="overline text-[10px]!">{KIND_LABEL[kind] ?? kind}</span>
          </span>
          <span aria-hidden className="h-px w-3 bg-paper-300" />
          <span className="overline text-[10px]!">
            {session?.codexSessionId ? 'Tiếp nối' : 'Phiên mới'}
          </span>
          {dateLabel ? (
            <>
              <span aria-hidden className="h-px w-3 bg-paper-300" />
              <span className="overline text-[10px]! tabular">{dateLabel}</span>
            </>
          ) : null}
        </div>
        <h1
          className="mt-1 line-clamp-1 font-serif text-[17px] leading-tight text-ink-900 tracking-[-0.015em]"
          style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 36, 'wght' 500" }}
          title={session?.title ?? undefined}
        >
          {session?.title ?? 'Đang tải…'}
        </h1>
      </div>
      <button
        type="button"
        onClick={onDelete}
        title="Xóa phiên"
        aria-label="Xóa phiên"
        className="mt-1 rounded-[5px] p-1.5 text-ink-400 hover:bg-lacquer-50 hover:text-lacquer-500 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    </header>
  );
}
