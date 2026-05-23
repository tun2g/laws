'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { NewsArticle, NewsSource } from '@laws/shared';
import { NewsSummaryModal } from './news-summary-modal';

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

export function NewsCard({
  article,
  source,
}: {
  article: NewsArticle;
  source: NewsSource | undefined;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const showImage = Boolean(article.imageUrl) && !imgFailed;

  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-[8px] border border-[var(--color-paper-200)] bg-[var(--color-paper-0)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-accent-500)]/35">
        <a
          href={article.articleUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="relative block aspect-[16/9] w-full overflow-hidden bg-[var(--color-paper-100)]"
          aria-label={article.title}
        >
          {showImage ? (
            <Image
              src={article.imageUrl!}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 320px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              onError={() => setImgFailed(true)}
              unoptimized
            />
          ) : (
            <FallbackCover label={source?.label ?? article.source} />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-[var(--color-ink-900)]/85 px-2.5 py-0.5 text-[10.5px] font-medium tracking-[0.04em] text-[var(--color-paper-0)] backdrop-blur">
            {source?.label ?? article.source}
          </span>
        </a>

        <div className="flex flex-1 flex-col gap-3 px-5 py-4">
          <a
            href={article.articleUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="block"
          >
            <h3
              className="font-serif text-[18px] leading-[1.28] tracking-[-0.01em] text-[var(--color-ink-900)] line-clamp-3 group-hover:text-[var(--color-accent-500)] transition-colors"
              style={{ fontVariationSettings: "'SOFT' 80, 'opsz' 22, 'wght' 510" }}
            >
              {article.title}
            </h3>
          </a>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--color-paper-200)] pt-3 text-[11.5px]">
            <span className="tabular text-[var(--color-ink-500)] uppercase tracking-[0.04em]">
              {relativeTime(article.publishedAt)}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSummaryOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[12px] font-medium text-[var(--color-accent-500)] transition-colors hover:bg-[var(--color-accent-500)]/8"
                aria-label="Tóm tắt bài viết với Codex"
              >
                <SparkleIcon />
                Tóm tắt
              </button>
              <span aria-hidden className="h-3 w-px bg-[var(--color-paper-300)]" />
              <a
                href={article.articleUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-[12px] text-[var(--color-ink-500)] transition-colors hover:bg-[var(--color-paper-100)] hover:text-[var(--color-ink-900)]"
              >
                Đọc bản gốc
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </article>

      <NewsSummaryModal
        article={article}
        source={source}
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
      />
    </>
  );
}

function FallbackCover({ label }: { label: string }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background:
          'linear-gradient(135deg, var(--color-paper-100) 0%, var(--color-paper-200) 100%)',
      }}
      aria-hidden
    >
      <span
        className="font-serif text-[22px] tracking-[-0.015em] text-[var(--color-ink-500)] italic"
        style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 36, 'wght' 460" }}
      >
        {label}
      </span>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}
