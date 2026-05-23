'use client';

import { ReactNode } from 'react';
import { Logo } from '@/components/logo';

/**
 * Two-column editorial layout used by login / register / onboarding.
 * Left column: form. Right column: scholarly masthead with a decorative
 * "table of contents" silhouette and a folio number, evoking the title
 * page of a legal journal.
 */
export function AuthLayout({
  overline,
  title,
  subtitle,
  children,
  footer,
}: {
  overline: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-8 py-10 sm:px-14">
        <Logo />

        <div className="flex flex-1 items-center">
          <div className="w-full max-w-md paper-fade-up">
            <div className="overline">{overline}</div>
            <h1
              className="mt-3 font-serif text-[40px] leading-[1.05] text-[var(--color-ink-900)] tracking-[-0.025em]"
              style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 144, 'wght' 480" }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--color-ink-600)]">
                {subtitle}
              </p>
            ) : null}
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-7 text-[13px] text-[var(--color-ink-500)]">{footer}</div> : null}
          </div>
        </div>

        <footer className="overline">© Laws Counsel · Hà Nội</footer>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-[var(--color-paper-200)] bg-[var(--color-ink-900)] text-[var(--color-paper-50)] lg:flex lg:flex-col lg:px-14 lg:py-10">
        {/* paper noise overlay tinted darker */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.85  0 0 0 0.08 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            backgroundSize: '220px 220px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[var(--color-accent-500)]/30 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-[var(--color-lacquer-500)]/15 blur-[120px]"
        />

        <div className="relative flex flex-col h-full">
          <div className="flex items-center justify-between">
            <div className="overline !text-[var(--color-paper-300)]">Laws Counsel</div>
            <div className="overline tabular !text-[var(--color-paper-300)]">
              {new Date().toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>

          <div className="my-auto">
            <p
              className="font-serif italic text-[20px] leading-[1.4] text-[var(--color-paper-100)]/90"
              style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 100, 'wght' 400" }}
            >
              &ldquo;Pháp luật là nghệ thuật của cái tốt và cái công bằng — <em>ars boni et aequi</em>.&rdquo;
            </p>
            <div className="overline mt-3 !text-[var(--color-brass-300)]">— Celsus</div>

            <hr className="my-10 border-0 h-px bg-gradient-to-r from-transparent via-[var(--color-paper-300)]/40 to-transparent" />

            <h2
              className="font-serif text-[44px] leading-[1.05] tracking-[-0.025em]"
              style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 144, 'wght' 460" }}
            >
              Trợ lý của
              <br />
              <span className="italic text-[var(--color-brass-300)]">luật sư Việt Nam.</span>
            </h2>
            <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[var(--color-paper-100)]/80">
              Tra cứu thủ tục, rà soát dự thảo, dịch song ngữ — toàn bộ chạy bằng tài khoản
              ChatGPT/Codex của riêng bạn. Không API key dùng chung, không lưu nội dung
              ngoài máy chủ của bạn.
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[var(--color-paper-300)]">
            <span>Counsel · Hà Nội</span>
            <span className="tabular">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
