'use client';

import Link from 'next/link';
import type { ChatSession, SkillRun } from '@laws/shared';
import { Button } from '@/components/ui/button';

const KIND_LABEL: Record<string, string> = {
  research: 'Tra cứu',
  review: 'Rà soát',
  translate: 'Dịch',
  'dual-lang': 'Song ngữ',
  free: 'Tự do',
  docx: 'Xuất Word',
};

const STATUS_LABEL: Record<string, string> = {
  QUEUED: 'Chờ chạy',
  RUNNING: 'Đang chạy',
  DONE: 'Hoàn tất',
  FAILED: 'Lỗi',
  CANCELLED: 'Đã hủy',
};

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'vừa xong';
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

interface Props {
  projectId: string;
  sessions: ChatSession[];
  sessionsLoading: boolean;
  legacyRuns: SkillRun[];
  showLegacy: boolean;
  onToggleLegacy: () => void;
  onCreate: () => void;
}

export function ChatSessionsSection({
  projectId,
  sessions,
  sessionsLoading,
  legacyRuns,
  showLegacy,
  onToggleLegacy,
  onCreate,
}: Props) {
  return (
    <>
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2
            className="font-serif text-[22px] tracking-[-0.02em] text-[var(--color-ink-900)]"
            style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 36, 'wght' 500" }}
          >
            Các cuộc trò chuyện
          </h2>
          <span className="overline tabular">{sessions.length} phiên</span>
        </div>

        {sessionsLoading ? (
          <Skeleton />
        ) : sessions.length === 0 ? (
          <EmptyChats onCreate={onCreate} />
        ) : (
          <ul className="divide-y divide-[var(--color-paper-200)] border-t border-b border-[var(--color-paper-200)]">
            {sessions.map((s, i) => (
              <li key={s.id}>
                <Link
                  href={`/projects/${projectId}/chat/${s.id}` as never}
                  className="group grid grid-cols-[40px_1fr_auto_auto] items-center gap-4 py-4 transition-colors hover:bg-[var(--color-paper-100)]/40 px-2 -mx-2 rounded-[4px]"
                >
                  <span
                    className="font-serif text-[13px] tabular text-[var(--color-ink-400)] group-hover:text-[var(--color-accent-500)] transition-colors"
                    style={{ fontVariationSettings: "'opsz' 14, 'wght' 500" }}
                  >
                    {(i + 1).toString().padStart(2, '0')}.
                  </span>
                  <div className="min-w-0">
                    <div
                      className="truncate font-serif text-[16.5px] tracking-[-0.01em] text-[var(--color-ink-900)]"
                      style={{ fontVariationSettings: "'SOFT' 80, 'opsz' 24, 'wght' 460" }}
                    >
                      {s.title}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-[var(--color-ink-500)]">
                      {relativeTime(s.updatedAt)}
                    </div>
                  </div>
                  <span className="overline !text-[10px]">{KIND_LABEL[s.kind] ?? s.kind}</span>
                  <span
                    aria-hidden
                    className="text-[var(--color-ink-300)] group-hover:text-[var(--color-accent-500)] transition-colors"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {legacyRuns.length > 0 ? (
        <section className="border-t border-[var(--color-paper-200)] pt-8">
          <button
            type="button"
            onClick={onToggleLegacy}
            className="flex w-full items-center justify-between text-left group"
          >
            <h3
              className="font-serif text-[18px] tracking-[-0.015em] text-[var(--color-ink-700)] group-hover:text-[var(--color-ink-900)] transition-colors"
              style={{ fontVariationSettings: "'SOFT' 80, 'opsz' 28, 'wght' 480" }}
            >
              Lịch sử cũ ({legacyRuns.length})
            </h3>
            <span className="overline">{showLegacy ? '— Ẩn' : '+ Hiện'}</span>
          </button>
          {showLegacy ? (
            <ul className="mt-4 divide-y divide-[var(--color-paper-200)] border-t border-b border-[var(--color-paper-200)]">
              {legacyRuns.map((run) => (
                <li key={run.id}>
                  <Link
                    href={`/skills/runs/${run.id}` as never}
                    className="flex items-center justify-between gap-4 py-3.5 px-2 -mx-2 hover:bg-[var(--color-paper-100)]/40 transition-colors rounded-[4px]"
                  >
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-[var(--color-ink-700)]">
                        {KIND_LABEL[run.kind] ?? run.kind}
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-[var(--color-ink-500)]">
                        {run.input.slice(0, 110)}
                        {run.input.length > 110 ? '…' : ''}
                      </div>
                    </div>
                    <span className="overline !text-[10px] !text-[var(--color-ink-600)]">
                      {STATUS_LABEL[run.status] ?? run.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-14 rounded-[5px] bg-[var(--color-paper-100)] shimmer" />
      ))}
    </div>
  );
}

function EmptyChats({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-[6px] border border-dashed border-[var(--color-paper-300)] bg-[var(--color-paper-0)]/60 px-6 py-14 text-center">
      <div className="overline mb-3">Chưa có nội dung</div>
      <p
        className="font-serif text-[20px] text-[var(--color-ink-800)] tracking-[-0.01em]"
        style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 28, 'wght' 480" }}
      >
        Bắt đầu cuộc trò chuyện đầu tiên cho dự án này.
      </p>
      <p className="mt-1 text-[13px] text-[var(--color-ink-500)]">
        Chọn loại tác vụ (tra cứu, rà soát, dịch…) và nhập yêu cầu — Codex sẽ trả lời theo
        bối cảnh của bạn.
      </p>
      <Button className="mt-5" onClick={onCreate}>
        + Tạo cuộc trò chuyện
      </Button>
    </div>
  );
}
