'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { Logo } from './logo';
import { useAuth } from '@/lib/auth-store';
import { cn } from '@/lib/cn';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const Icon = {
  dashboard: (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5 12 4l9 6.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-6h4v6" />
    </svg>
  ),
  projects: (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  ),
  skills: (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="2.8" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.86l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.86-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.86.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.95a1.7 1.7 0 0 0-.34-1.86l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.86.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.86-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.86V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  ),
};

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Bản tin pháp luật', icon: Icon.dashboard },
  { href: '/projects', label: 'Dự án', icon: Icon.projects },
  { href: '/skills', label: 'Công cụ', icon: Icon.skills },
  { href: '/settings', label: 'Cài đặt', icon: Icon.settings },
];

const SECTION_META: Array<{ match: string; overline: string; title: string }> = [
  { match: '/dashboard', overline: 'Theo dõi cập nhật', title: 'Bản tin pháp luật' },
  { match: '/projects', overline: 'Hồ sơ vụ việc', title: 'Không gian dự án' },
  { match: '/skills', overline: 'Tác vụ hỗ trợ', title: 'Công cụ AI pháp lý' },
  { match: '/settings', overline: 'Quản trị cá nhân', title: 'Hồ sơ và Codex' },
];
const DEFAULT_SECTION = {
  match: '/dashboard',
  overline: 'Theo dõi cập nhật',
  title: 'Bản tin pháp luật',
};
const SIDEBAR_STORAGE_KEY = 'laws.sidebar.collapsed';

function formatDateVi(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${day}.${month}.${d.getFullYear()}`;
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff =
    d.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / 86400000);
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    setSidebarCollapsed(saved === '1');
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && !user.codexConnected && !pathname.startsWith('/onboarding')) {
      router.replace('/onboarding/connect-codex');
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="paper-fade-up flex items-center gap-3 text-[13px] text-[var(--color-ink-500)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-500)] pulse-dot" />
          Đang tải…
        </div>
      </div>
    );
  }

  const currentSection =
    SECTION_META.find((item) => pathname === item.match || pathname.startsWith(`${item.match}/`)) ??
    DEFAULT_SECTION;

  return (
    <div
      className={cn(
        'grid min-h-screen bg-[linear-gradient(180deg,rgba(248,244,234,0.92),rgba(245,239,227,0.96))] transition-[grid-template-columns] duration-200',
        sidebarCollapsed ? 'grid-cols-[96px_1fr]' : 'grid-cols-[280px_1fr]',
      )}
    >
      <a href="#main-content" className="skip-link">Bỏ qua tới nội dung</a>
      <aside className="sticky top-0 flex h-screen flex-col border-r border-[rgba(188,174,139,0.4)] bg-[linear-gradient(180deg,rgba(16,14,11,0.98),rgba(27,24,19,0.98))] text-[var(--color-paper-0)] shadow-[16px_0_40px_-28px_rgba(20,18,14,0.55)]">
        <div className={cn('pt-6', sidebarCollapsed ? 'px-3' : 'px-6')}>
          <div className={cn(sidebarCollapsed ? 'flex flex-col items-center gap-4' : 'flex items-start justify-between gap-3')}>
            <div className={cn(sidebarCollapsed ? 'flex flex-col items-center gap-3' : 'flex items-center gap-3')}>
              <Logo compact />
              {!sidebarCollapsed ? (
                <div className="min-w-0">
                  <div className="font-serif text-[17px] tracking-[-0.015em] text-[var(--color-paper-0)]">
                    Laws
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[rgba(217,183,119,0.72)]">
                    Counsel · Hà Nội
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              aria-label={sidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
              title={sidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
              onClick={() => {
                const next = !sidebarCollapsed;
                setSidebarCollapsed(next);
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0');
                }
              }}
              className={cn(
                'rounded-[8px] border border-white/10 bg-white/[0.04] p-2 text-[rgba(247,242,230,0.72)] transition-colors hover:bg-white/[0.08] hover:text-[var(--color-paper-0)]',
              )}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {sidebarCollapsed ? (
                  <path d="m9 18 6-6-6-6" />
                ) : (
                  <path d="m15 18-6-6 6-6" />
                )}
              </svg>
            </button>
          </div>
        </div>
        <div className={cn('mt-6', sidebarCollapsed ? 'px-3' : 'px-6')}>
          <div className="h-px bg-gradient-to-r from-transparent via-[rgba(217,183,119,0.45)] to-transparent" />
        </div>
        <div className={cn('mt-5 flex-1 overflow-y-auto', sidebarCollapsed ? 'px-3' : 'px-3')}>
          <nav className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href as never}
                  className={cn(
                    'group relative flex rounded-[8px] text-[14px] transition-all duration-150',
                    sidebarCollapsed ? 'mx-auto h-12 w-12 items-center justify-center px-0 py-0' : 'items-center gap-3 px-3 py-2.5',
                    active
                      ? 'bg-[linear-gradient(90deg,rgba(217,183,119,0.16),rgba(255,255,255,0.05))] text-[var(--color-paper-0)] font-medium'
                      : 'text-[rgba(247,242,230,0.7)] hover:text-[var(--color-paper-0)] hover:bg-white/6',
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {active ? (
                    <span
                      aria-hidden
                      className={cn(
                        'absolute rounded-full bg-[var(--color-brass-300)]',
                        sidebarCollapsed
                          ? 'left-1/2 top-[6px] h-[2px] w-6 -translate-x-1/2'
                          : 'left-0 top-1/2 h-6 w-[2px] -translate-y-1/2',
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      'transition-colors',
                      active
                        ? 'text-[var(--color-brass-300)]'
                        : 'text-[rgba(247,242,230,0.45)] group-hover:text-[var(--color-paper-0)]',
                    )}
                  >
                    {item.icon}
                  </span>
                  {!sidebarCollapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 p-4">
          <div className="mb-3 h-px bg-gradient-to-r from-transparent via-[rgba(217,183,119,0.35)] to-transparent" />
          <div
            className={cn(
              'rounded-[10px] border border-white/8 bg-white/[0.045] px-3 py-3 transition-colors hover:bg-white/[0.065]',
              sidebarCollapsed ? 'flex flex-col items-center gap-3 px-2 py-3' : 'flex items-center gap-3',
            )}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brass-500)] text-[13px] font-medium text-[var(--color-ink-900)]"
              aria-hidden
            >
              {(user.name || user.email || '?').trim().slice(0, 1).toUpperCase()}
            </div>
            {!sidebarCollapsed ? (
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-[var(--color-paper-0)]">
                  {user.name}
                </div>
                <div className="truncate text-[11.5px] text-[rgba(247,242,230,0.62)]">
                  {user.email}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                logout();
                router.push('/');
              }}
              aria-label="Đăng xuất"
              title="Đăng xuất"
              className="shrink-0 rounded-[6px] p-1.5 text-[rgba(247,242,230,0.62)] transition-colors hover:bg-white/8 hover:text-[var(--color-paper-0)]"
            >
              <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 17l5-5-5-5" />
                <path d="M20 12H9" />
                <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-col">
        <header className="border-b border-[rgba(188,174,139,0.42)] bg-[rgba(255,253,248,0.68)] px-8 py-3">
          <div className="flex items-center justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="overline">{currentSection.overline}</span>
                <span className="h-px w-8 bg-[var(--color-paper-300)]" aria-hidden />
                <span className="text-[11px] text-[var(--color-ink-500)] tabular">
                  {formatDateVi(new Date())}
                </span>
                <span className="hidden rounded-full border border-[rgba(188,174,139,0.5)] bg-[rgba(241,233,215,0.55)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-ink-500)] md:block">
                  {new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ConnectionPill connected={user.codexConnected} />
            </div>
          </div>
        </header>

        <div id="main-content" className="flex-1 px-8 py-8 paper-fade-up">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </div>
      </main>
    </div>
  );
}

function ConnectionPill({ connected }: { connected: boolean }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-[0.05em] uppercase shadow-[0_1px_0_rgba(20,18,14,0.03)]',
        connected
          ? 'border-[var(--color-success-500)]/22 bg-[rgba(44,94,58,0.08)] text-[var(--color-success-500)]'
          : 'border-[var(--color-brass-500)]/34 bg-[rgba(168,132,60,0.08)] text-[var(--color-brass-700)]',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          connected ? 'bg-[var(--color-success-500)]' : 'bg-[var(--color-brass-500)] pulse-dot',
        )}
      />
      {connected ? 'Codex · trực tuyến' : 'Codex · chưa kết nối'}
    </div>
  );
}
