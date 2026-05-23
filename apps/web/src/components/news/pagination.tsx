'use client';

import { cn } from '@/lib/cn';

/**
 * Compact numeric pagination with first / prev / window / next / last.
 * Shows up to 5 page buttons centred around the current page.
 */
export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = windowAround(page, totalPages, 5);

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Phân trang">
      <PageButton onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} label="Trước">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m15 18-6-6 6-6" />
        </svg>
      </PageButton>
      {pages[0]! > 1 ? (
        <>
          <PageNumberButton page={1} active={false} onClick={onChange} />
          {pages[0]! > 2 ? <Ellipsis /> : null}
        </>
      ) : null}
      {pages.map((p) => (
        <PageNumberButton key={p} page={p} active={p === page} onClick={onChange} />
      ))}
      {pages[pages.length - 1]! < totalPages ? (
        <>
          {pages[pages.length - 1]! < totalPages - 1 ? <Ellipsis /> : null}
          <PageNumberButton page={totalPages} active={false} onClick={onChange} />
        </>
      ) : null}
      <PageButton onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} label="Sau">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m9 18 6-6-6-6" />
        </svg>
      </PageButton>
    </nav>
  );
}

function windowAround(current: number, total: number, size: number): number[] {
  const half = Math.floor(size / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + size - 1);
  start = Math.max(1, end - size + 1);
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-[var(--color-paper-300)] bg-[var(--color-paper-0)] text-[var(--color-ink-600)] transition-colors hover:bg-[var(--color-paper-100)] hover:text-[var(--color-ink-900)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--color-paper-0)]"
    >
      {children}
    </button>
  );
}

function PageNumberButton({
  page,
  active,
  onClick,
}: {
  page: number;
  active: boolean;
  onClick: (page: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(page)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'h-8 min-w-[32px] px-2.5 rounded-[5px] text-[13px] tabular font-medium transition-colors',
        active
          ? 'bg-[var(--color-accent-500)] text-[var(--color-paper-0)]'
          : 'border border-[var(--color-paper-300)] bg-[var(--color-paper-0)] text-[var(--color-ink-700)] hover:bg-[var(--color-paper-100)]',
      )}
    >
      {page}
    </button>
  );
}

function Ellipsis() {
  return (
    <span aria-hidden className="px-1 text-[var(--color-ink-400)]">
      …
    </span>
  );
}
