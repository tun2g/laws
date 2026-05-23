'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { api } from '@/lib/api';
import type { SkillSummary } from '@laws/shared';

export default function SkillsIndexPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => (await api.get<SkillSummary[]>('/skills')).data,
  });

  const skills = data ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="border-b border-[var(--color-paper-200)] pb-6">
          <div className="overline">Thư viện</div>
          <h1
            className="mt-2 font-serif text-[40px] leading-[1.05] text-[var(--color-ink-900)] tracking-[-0.025em]"
            style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 144, 'wght' 480" }}
          >
            Công cụ chuyên môn
          </h1>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[var(--color-ink-600)]">
            Mỗi công cụ là một system prompt được tinh chỉnh cho hành nghề luật tại Việt
            Nam. Chạy bằng tài khoản Codex của bạn.
          </p>
        </header>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 rounded-[6px] bg-[var(--color-paper-100)] shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {skills.map((s, i) => (
              <Link
                key={s.id}
                href={`/skills/${s.id}` as never}
                className="group relative paper-card overflow-hidden p-6 transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-accent-500)]/40"
              >
                <span
                  aria-hidden
                  className="absolute right-4 top-4 font-serif text-[12px] tabular text-[var(--color-ink-300)]"
                  style={{ fontVariationSettings: "'opsz' 14, 'wght' 500" }}
                >
                  {(i + 1).toString().padStart(2, '0')}
                </span>
                <div
                  className="font-serif text-[20px] tracking-[-0.015em] text-[var(--color-ink-900)]"
                  style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 28, 'wght' 550" }}
                >
                  {s.labelVi}
                </div>
                <div className="overline mt-1 !text-[10px]">{s.labelEn}</div>
                <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-ink-600)]">
                  {s.descriptionVi}
                </p>
                <div className="mt-5 flex items-center gap-2">
                  {s.needsWebSearch ? (
                    <span className="overline !text-[10px] !text-[var(--color-accent-500)]">
                      ✦ Có tra cứu web
                    </span>
                  ) : (
                    <span className="overline !text-[10px]">Cục bộ</span>
                  )}
                  <span className="ml-auto text-[12px] text-[var(--color-accent-500)] opacity-0 transition-opacity group-hover:opacity-100">
                    Mở →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
