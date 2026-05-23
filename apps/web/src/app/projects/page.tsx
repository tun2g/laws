'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { Project } from '@laws/shared';

export default function ProjectsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get<Project[]>('/projects')).data,
  });

  const projects = data ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Link href="/projects/new">
            <Button>+ Tạo dự án</Button>
          </Link>
        </div>
        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 rounded-[8px] bg-[var(--color-paper-100)] shimmer" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Empty />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {projects.map((p) => (
              <article
                key={p.id}
                className="paper-card group px-6 py-5 transition-all duration-200 hover:-translate-y-px"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="overline">Matter</div>
                    <Link
                      href={`/projects/${p.id}` as never}
                      className="mt-2 block font-serif text-[24px] leading-[1.15] tracking-[-0.02em] text-[var(--color-ink-900)] transition-colors hover:text-[var(--color-accent-500)]"
                      style={{ fontVariationSettings: "'SOFT' 90, 'opsz' 30, 'wght' 500" }}
                    >
                      {p.name}
                    </Link>
                  </div>
                  <div className="rounded-full border border-[var(--color-paper-300)] bg-[var(--color-paper-50)] px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-[var(--color-ink-500)]">
                    {new Date(p.updatedAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Khách hàng" value={p.clientName ?? 'Chưa khai báo'} />
                  <InfoRow
                    label="Cập nhật"
                    value={new Date(p.updatedAt).toLocaleString('vi-VN')}
                  />
                </div>

                <div className="mt-5 border-t border-[rgba(188,174,139,0.42)] pt-4">
                  <p className="line-clamp-2 text-[13.5px] leading-relaxed text-[var(--color-ink-600)]">
                    {p.description ??
                      'Chưa có mô tả matter. Nên bổ sung phạm vi vụ việc để AI hỗ trợ chính xác hơn.'}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div className="text-[12px] text-[var(--color-ink-500)]">
                    Tạo lúc {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  <Link href={`/projects/${p.id}` as never}>
                    <Button variant="secondary" size="sm">
                      Mở hồ sơ
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Empty() {
  return (
    <div className="paper-card px-6 py-14 text-center">
      <div className="overline mb-3">Trống</div>
      <p
        className="font-serif text-[22px] tracking-[-0.01em] text-[var(--color-ink-800)]"
        style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 36, 'wght' 480" }}
      >
        Chưa có dự án nào.
      </p>
      <p className="mt-1 text-[13px] text-[var(--color-ink-500)]">
        Tạo dự án đầu tiên để bắt đầu lưu lại công việc của bạn.
      </p>
      <Link href="/projects/new" className="mt-4 inline-block">
        <Button size="sm">Tạo dự án đầu tiên</Button>
      </Link>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-ink-500)]">{label}</div>
      <div className="mt-1 text-[14px] text-[var(--color-ink-800)]">{value}</div>
    </div>
  );
}
