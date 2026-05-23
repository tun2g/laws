'use client';

import { Suspense, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { NewsCard } from '@/components/news/news-card';
import { Pagination } from '@/components/news/pagination';
import { fetchNewsPage, listNewsSources, refreshNews } from '@/lib/news';
import { readableError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { cn } from '@/lib/cn';
import type { NewsSourceId } from '@laws/shared';

const PAGE_SIZE = 9;
const VALID_SOURCES = new Set<NewsSourceId>([
  'thuvienphapluat',
  'baochinhphu',
  'moj',
  'tapchitoaan',
  'luatvietnam',
]);

function parseSource(raw: string | null): NewsSourceId | undefined {
  if (raw && VALID_SOURCES.has(raw as NewsSourceId)) return raw as NewsSourceId;
  return undefined;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeletonPage />}>
      <DashboardPageContent />
    </Suspense>
  );
}

function DashboardPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const source = parseSource(searchParams.get('source'));

  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const sourcesQuery = useQuery({
    queryKey: ['news-sources'],
    queryFn: listNewsSources,
  });

  const feedQuery = useQuery({
    queryKey: ['news', page, source ?? 'all'],
    queryFn: () => fetchNewsPage({ page, pageSize: PAGE_SIZE, source }),
    placeholderData: (prev) => prev,
  });

  const items = feedQuery.data?.items ?? [];
  const totalPages = feedQuery.data?.totalPages ?? 1;
  const total = feedQuery.data?.total ?? 0;

  const sourceById = useMemo(
    () => new Map((sourcesQuery.data ?? []).map((s) => [s.id, s])),
    [sourcesQuery.data],
  );

  const navigate = (next: { page?: number; source?: NewsSourceId | undefined }) => {
    const nextPage = next.page ?? page;
    const nextSource = 'source' in next ? next.source : source;
    const params = new URLSearchParams();
    if (nextPage > 1) params.set('page', String(nextPage));
    if (nextSource) params.set('source', nextSource);
    const qs = params.toString();
    router.push((qs ? `${pathname}?${qs}` : pathname) as never);
  };

  const onPickSource = (s: NewsSourceId | undefined) => navigate({ source: s, page: 1 });
  const onChangePage = (p: number) => {
    navigate({ page: p });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNews();
      await feedQuery.refetch();
      toast.success('Đã làm mới');
    } catch (err) {
      toast.error(readableError(err, 'Không làm mới được'));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="paper-card px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="overline">Bộ lọc nguồn</div>
              <p className="mt-1 text-[13.5px] text-[var(--color-ink-500)]">
                Chuyển nhanh giữa các nguồn pháp lý để theo dõi chuyên sâu hoặc xem toàn cảnh.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SourceChip
                label="Tất cả"
                active={!source}
                count={total}
                onClick={() => onPickSource(undefined)}
              />
              {(sourcesQuery.data ?? []).map((s) => (
                <SourceChip
                  key={s.id}
                  label={s.label}
                  active={source === s.id}
                  onClick={() => onPickSource(s.id)}
                />
              ))}
            </div>
          </div>
          {user?.role === 'ADMIN' ? (
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" size="sm" loading={refreshing} onClick={onRefresh}>
                Làm mới nguồn tin
              </Button>
            </div>
          ) : null}
        </section>

        {feedQuery.isLoading ? (
          <Skeleton />
        ) : items.length === 0 ? (
          <EmptyFeed />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  source={sourceById.get(article.source)}
                />
              ))}
            </div>
            <div className="flex flex-col items-center gap-3 pt-4">
              <Pagination page={page} totalPages={totalPages} onChange={onChangePage} />
              <div className="text-[11px] uppercase tracking-[0.04em] text-[var(--color-ink-400)] tabular">
                Trang {page} / {totalPages} · {total.toLocaleString('vi-VN')} bài
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function DashboardSkeletonPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <section className="paper-card px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="overline">Bộ lọc nguồn</div>
              <div className="mt-2 h-4 w-72 rounded bg-[var(--color-paper-100)] shimmer" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-24 rounded-full bg-[var(--color-paper-100)] shimmer"
                />
              ))}
            </div>
          </div>
        </section>
        <Skeleton />
      </div>
    </AppShell>
  );
}

function SourceChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-medium transition-colors',
        active
          ? 'bg-[var(--color-accent-500)] text-[var(--color-paper-0)] shadow-[var(--shadow-paper)]'
          : 'border border-[var(--color-paper-300)] bg-[var(--color-paper-0)] text-[var(--color-ink-700)] hover:bg-[var(--color-paper-100)]',
      )}
    >
      {label}
      {count !== undefined ? (
        <span
          className={cn(
            'tabular text-[11px]',
            active ? 'text-[var(--color-paper-200)]' : 'text-[var(--color-ink-400)]',
          )}
        >
          {count.toLocaleString('vi-VN')}
        </span>
      ) : null}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[8px] border border-[var(--color-paper-200)] bg-[var(--color-paper-0)]"
        >
          <div className="aspect-[16/9] bg-[var(--color-paper-100)] shimmer" />
          <div className="space-y-2 px-5 py-4">
            <div className="h-4 w-3/4 rounded bg-[var(--color-paper-100)] shimmer" />
            <div className="h-4 w-1/2 rounded bg-[var(--color-paper-100)] shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="paper-card px-6 py-16 text-center">
      <p
        className="font-serif text-[22px] tracking-[-0.01em] text-[var(--color-ink-800)]"
        style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 36, 'wght' 480" }}
      >
        Chưa có bài viết nào.
      </p>
      <p className="mt-2 text-[13px] text-[var(--color-ink-500)]">
        Hệ thống đang chờ chu kỳ thu thập đầu tiên. Quay lại sau ít phút hoặc liên hệ
        quản trị viên để cập nhật ngay.
      </p>
    </div>
  );
}
