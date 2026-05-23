'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { env } from '@/config/env';
import { useAuth } from '@/lib/auth-store';

const PRACTICE_AREAS = [
  'Tư vấn doanh nghiệp',
  'Rà soát hợp đồng',
  'Tra cứu thủ tục hành chính',
  'Ý kiến pháp lý song ngữ',
];

const FEATURE_COLUMNS = [
  {
    overline: 'Nghiên cứu',
    title: 'Tìm nhanh nguồn, giữ rõ căn cứ',
    body:
      'Tập trung vào văn bản, thủ tục và nguồn kiểm tra lại được. Phù hợp khi luật sư cần tốc độ nhưng vẫn phải bảo toàn khả năng đối chiếu.',
  },
  {
    overline: 'Soạn thảo',
    title: 'Làm việc theo matter thay vì từng prompt rời',
    body:
      'Mỗi hồ sơ có dự án, hội thoại và đầu ra riêng. AI không bị tách khỏi bối cảnh vụ việc đang xử lý.',
  },
  {
    overline: 'Kiểm soát',
    title: 'Tài khoản Codex thuộc về từng người dùng',
    body:
      'Không dùng shared API key. Mỗi luật sư đăng nhập bằng Codex riêng và giữ nhịp làm việc theo runtime của chính mình.',
  },
];

const WORKFLOW = [
  {
    step: '01',
    title: 'Mở hồ sơ',
    body: 'Tạo matter, nhập bối cảnh khách hàng, gom câu hỏi và tài liệu về cùng một nơi.',
  },
  {
    step: '02',
    title: 'Chạy công cụ',
    body: 'Nghiên cứu, rà soát, dịch thuật hoặc làm việc qua chat với Codex theo đúng mục tiêu tác vụ.',
  },
  {
    step: '03',
    title: 'Lưu vết',
    body: 'Giữ lại bản nháp, trao đổi và usage trong cùng workspace để tiếp tục xử lý hoặc bàn giao nội bộ.',
  },
];

const BENEFITS = [
  'Phù hợp cho luật sư cần tốc độ nhưng vẫn cần cấu trúc làm việc rõ ràng.',
  'Giảm việc chuyển đổi giữa nhiều công cụ chat, tài liệu và ghi chú rời rạc.',
  'Tạo mặt bằng tốt hơn để mở rộng sang kiểm tra trích dẫn, precedent bank và DOCX client-ready.',
];

const STATS = [
  ['Workspace', 'Theo matter / dự án'],
  ['AI runtime', 'Codex account riêng'],
  ['Tác vụ chính', 'Research · Review · Translate'],
  ['Đầu ra', 'Chat · Draft · Song ngữ'],
];

export default function Landing() {
  const { user, loading } = useAuth();
  const primaryHref = user
    ? user.codexConnected
      ? '/dashboard'
      : '/onboarding/connect-codex'
    : '/register';
  const primaryLabel = user
    ? user.codexConnected
      ? 'Vào workspace'
      : 'Tiếp tục kết nối Codex'
    : 'Bắt đầu dùng thử';
  const secondaryHref = user ? '/projects' : '/login';
  const secondaryLabel = user ? 'Mở dự án của tôi' : 'Đăng nhập';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[rgba(188,174,139,0.42)] bg-[rgba(255,253,248,0.88)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Logo />
          <div className="hidden items-center gap-6 lg:flex">
            {['Sản phẩm', 'Workflow', 'Ứng dụng'].map((item) => (
              <span key={item} className="text-[12px] uppercase tracking-[0.08em] text-[var(--color-ink-500)]">
                {item}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!loading ? (
              <>
                <Link href={secondaryHref}>
                  <Button variant="ghost" size="sm">
                    {secondaryLabel}
                  </Button>
                </Link>
                <Link href={primaryHref}>
                  <Button size="sm">{primaryLabel}</Button>
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-16">
        <section className="relative grid gap-6 pt-10 xl:grid-cols-[1.05fr_0.95fr]">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-12 top-8 h-40 w-40 rounded-full bg-[var(--color-brass-300)]/12 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-[var(--color-accent-500)]/8 blur-3xl"
          />
          <div className="paper-card-elevated paper-fade-up overflow-hidden px-8 py-9">
            <div className="overline">Landing workspace cho luật sư Việt Nam</div>
            <h1
              className="mt-4 max-w-4xl font-serif text-[52px] leading-[0.96] tracking-[-0.04em] text-[var(--color-ink-900)] sm:text-[68px]"
              style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 144, 'wght' 470" }}
            >
              Từ tra cứu
              <br />
              đến bản nháp,
              <br />
              <span className="italic text-[var(--color-accent-500)]">đúng nhịp làm việc pháp lý.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-[1.7] text-[var(--color-ink-600)]">
              Một workspace AI dành cho luật sư Việt Nam: làm việc theo matter, dùng Codex của
              riêng từng người, và giữ toàn bộ quá trình nghiên cứu, rà soát, dịch thuật trong
              cùng một cấu trúc rõ ràng.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {!loading ? (
                <>
                  <Link href={primaryHref}>
                    <Button size="lg">{primaryLabel}</Button>
                  </Link>
                  <Link href={secondaryHref}>
                    <Button size="lg" variant="secondary">
                      {secondaryLabel}
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {PRACTICE_AREAS.map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-[rgba(188,174,139,0.45)] bg-[rgba(241,233,215,0.5)] px-3 py-1.5 text-[12px] text-[var(--color-ink-600)] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="paper-card paper-fade-up overflow-hidden p-3" style={{ animationDelay: '90ms' }}>
            <div className="relative overflow-hidden rounded-[10px] border border-[rgba(188,174,139,0.38)] bg-[rgba(255,253,248,0.6)]">
              <Image
                src="/landing-hero-gemini.png"
                alt="Không gian làm việc AI cho luật sư"
                width={1536}
                height={1024}
                className="h-[540px] w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                priority
              />
              <div className="absolute left-5 top-5 w-[220px] rounded-[12px] border border-white/40 bg-[rgba(255,253,248,0.86)] px-4 py-4 backdrop-blur-md paper-fade-up">
                <div className="overline">Matter view</div>
                <div
                  className="mt-2 font-serif text-[22px] leading-[1.08] tracking-[-0.02em] text-[var(--color-ink-900)]"
                  style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 30, 'wght' 500" }}
                >
                  Hồ sơ thống nhất cho nghiên cứu, rà soát và bản nháp.
                </div>
              </div>
              <div
                className="absolute right-5 top-5 w-[210px] rounded-[12px] border border-[rgba(188,174,139,0.5)] bg-[rgba(20,18,14,0.82)] px-4 py-4 text-[var(--color-paper-0)] backdrop-blur-md paper-fade-up"
                style={{ animationDelay: '140ms' }}
              >
                <div className="overline !text-[rgba(247,242,230,0.7)]">Codex runtime</div>
                <div className="mt-3 space-y-2 text-[12px] text-[rgba(247,242,230,0.84)]">
                  <div className="flex items-center justify-between gap-3">
                    <span>Tài khoản</span>
                    <span className="text-[var(--color-brass-300)]">Riêng từng luật sư</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Ngữ cảnh</span>
                    <span className="text-[var(--color-brass-300)]">Theo matter</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Đầu ra</span>
                    <span className="text-[var(--color-brass-300)]">Có cấu trúc</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(20,18,14,0.78)] via-[rgba(20,18,14,0.18)] to-transparent px-6 pb-6 pt-16 text-[var(--color-paper-0)]">
                <div className="paper-fade-up max-w-md">
                  <div className="overline !text-[rgba(247,242,230,0.75)]">Visual concept</div>
                  <div
                    className="mt-2 font-serif text-[28px] leading-[1.08] tracking-[-0.025em]"
                    style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 54, 'wght' 470" }}
                  >
                    Một giao diện AI nên phục vụ quy trình nghề luật, không thay thế nó.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="paper-stagger grid gap-4 py-8 md:grid-cols-2 xl:grid-cols-4">
          {STATS.map(([label, value]) => (
            <div key={label} className="paper-card px-5 py-5">
              <div className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink-500)]">
                {label}
              </div>
              <div
                className="mt-3 font-serif text-[28px] leading-[1.06] tracking-[-0.02em] text-[var(--color-ink-900)]"
                style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 44, 'wght' 480" }}
              >
                {value}
              </div>
            </div>
          ))}
        </section>

        <section className="overflow-hidden py-2">
          <div className="rounded-[12px] border border-[rgba(188,174,139,0.42)] bg-[rgba(255,253,248,0.65)] px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px] uppercase tracking-[0.08em] text-[var(--color-ink-500)]">
              <span className="text-[var(--color-ink-700)]">Thiết kế cho workflow pháp lý hiện đại</span>
              <span>Nghiên cứu có cấu trúc</span>
              <span>Rà soát theo matter</span>
              <span>Dịch thuật có ngữ cảnh</span>
              <span>Codex runtime riêng</span>
              <span>Lưu vết nội bộ rõ ràng</span>
            </div>
          </div>
        </section>

        <section className="paper-card paper-fade-up px-8 py-8">
          <div className="grid gap-8 xl:grid-cols-[280px_1fr]">
            <div>
              <div className="overline">Vì sao layout này hợp với luật sư</div>
              <h2
                className="mt-3 font-serif text-[34px] leading-[1.04] tracking-[-0.025em] text-[var(--color-ink-900)]"
                style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 72, 'wght' 480" }}
              >
                Không chỉ là chat.
                <br />
                Là một môi trường làm việc.
              </h2>
            </div>
            <div className="paper-stagger grid gap-4 md:grid-cols-3">
              {FEATURE_COLUMNS.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[10px] border border-[rgba(188,174,139,0.42)] bg-[rgba(255,253,248,0.72)] px-5 py-5 transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className="overline">{item.overline}</div>
                  <div
                    className="mt-3 font-serif text-[24px] leading-[1.08] tracking-[-0.02em] text-[var(--color-ink-900)]"
                    style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 32, 'wght' 500" }}
                  >
                    {item.title}
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-ink-600)]">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 py-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="paper-card paper-fade-up px-8 py-8">
            <div className="overline">Luồng sử dụng</div>
            <h2
              className="mt-3 font-serif text-[34px] leading-[1.04] tracking-[-0.025em] text-[var(--color-ink-900)]"
              style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 72, 'wght' 480" }}
            >
              Từ mở hồ sơ
              <br />
              đến giao bản nháp.
            </h2>
            <div className="mt-6 space-y-4">
              {WORKFLOW.map((item, index) => (
                <div
                  key={item.step}
                  className="rounded-[10px] border border-[rgba(188,174,139,0.42)] bg-[rgba(255,253,248,0.68)] px-5 py-5 paper-fade-up"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="font-serif text-[26px] tabular text-[var(--color-accent-500)]">
                      {item.step}
                    </div>
                    <div
                      className="font-serif text-[24px] tracking-[-0.02em] text-[var(--color-ink-900)]"
                      style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 32, 'wght' 500" }}
                    >
                      {item.title}
                    </div>
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-ink-600)]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="paper-card paper-fade-up px-8 py-8" style={{ animationDelay: '120ms' }}>
            <div className="overline">Giá trị thực tế</div>
            <h2
              className="mt-3 font-serif text-[34px] leading-[1.04] tracking-[-0.025em] text-[var(--color-ink-900)]"
              style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 72, 'wght' 480" }}
            >
              Dễ dùng hơn cho nhóm pháp lý,
              <br />
              rõ hơn cho nội bộ.
            </h2>
            <div className="mt-6 space-y-4">
              {BENEFITS.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[10px] border border-[rgba(188,174,139,0.42)] bg-[rgba(255,253,248,0.68)] px-5 py-4 paper-fade-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-brass-500)]" />
                  <p className="text-[14px] leading-relaxed text-[var(--color-ink-600)]">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-[12px] border border-[rgba(31,53,72,0.16)] bg-[linear-gradient(135deg,rgba(31,53,72,0.08),rgba(168,132,60,0.08))] px-6 py-6">
              <div className="overline">Call to action</div>
              <div
                className="mt-3 font-serif text-[28px] leading-[1.08] tracking-[-0.025em] text-[var(--color-ink-900)]"
                style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 42, 'wght' 480" }}
              >
                Bắt đầu với một workspace được thiết kế cho luật sư, không phải cho người dùng chat phổ thông.
              </div>
              {!loading ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={primaryHref}>
                    <Button size="lg">{primaryLabel}</Button>
                  </Link>
                  <Link href={secondaryHref}>
                    <Button size="lg" variant="secondary">
                      {secondaryLabel}
                    </Button>
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-4 border-t border-[rgba(188,174,139,0.42)] bg-[rgba(241,233,215,0.42)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-8">
          <Logo compact />
          <div className="text-[11px] uppercase tracking-[0.04em] text-[var(--color-ink-500)]">
            © {new Date().getFullYear()} {env.brandName} · Không phải tư vấn pháp lý chính thức
          </div>
        </div>
      </footer>
    </div>
  );
}
