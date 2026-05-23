'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { NewsArticle, NewsSource } from '@laws/shared';
import { Button } from '@/components/ui/button';
import { streamNewsSummary } from '@/lib/news';

interface Props {
  article: NewsArticle;
  source: NewsSource | undefined;
  open: boolean;
  onClose: () => void;
}

type Phase = 'idle' | 'streaming' | 'done' | 'error';

/**
 * Modal that streams a Codex-generated summary of a single article.
 * Opens on demand; auto-starts the stream the first time it appears.
 * Re-opening after close starts a fresh stream (no caching).
 */
export function NewsSummaryModal({ article, source, open, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhase('streaming');
    setText('');
    setError(null);
    abortRef.current = streamNewsSummary(
      article.id,
      (event) => {
        if (event.type === 'delta') {
          setText((t) => t + event.text);
        } else if (event.type === 'done') {
          setPhase('done');
          abortRef.current = null;
        } else if (event.type === 'error') {
          setError(event.message);
          setPhase('error');
          abortRef.current = null;
        }
      },
      (msg) => {
        setError(msg);
        setPhase('error');
        abortRef.current = null;
      },
    );
    return () => {
      abortRef.current?.();
      abortRef.current = null;
    };
  }, [open, article.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink-900)]/60 backdrop-blur-sm px-4 py-8 paper-fade-up"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[8px] border border-[var(--color-paper-200)] bg-[var(--color-paper-0)] shadow-[var(--shadow-paper-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-[var(--color-paper-200)] px-7 py-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-500)]">
            <SparkleIcon />
            <span>Tóm tắt với Codex</span>
            {source ? (
              <>
                <span aria-hidden className="h-px w-5 bg-[var(--color-paper-300)]" />
                <span>{source.label}</span>
              </>
            ) : null}
          </div>
          <h2
            className="mt-2 font-serif text-[22px] leading-[1.2] tracking-[-0.015em] text-[var(--color-ink-900)]"
            style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 28, 'wght' 500" }}
          >
            {article.title}
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          {phase === 'streaming' && !text ? (
            <div className="flex items-center gap-2.5 text-[13px] text-[var(--color-ink-500)]">
              <span className="flex gap-1" aria-hidden>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-500)] pulse-dot" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-500)] pulse-dot" style={{ animationDelay: '200ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-500)] pulse-dot" style={{ animationDelay: '400ms' }} />
              </span>
              Codex đang đọc và tóm tắt…
            </div>
          ) : null}

          {text ? (
            <div className="chat-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
              {phase === 'streaming' ? <span className="caret" aria-hidden /> : null}
            </div>
          ) : null}

          {phase === 'error' && error ? (
            <div className="rounded-[5px] border border-[var(--color-lacquer-500)]/30 bg-[var(--color-lacquer-50)] px-4 py-3 text-[13px] text-[var(--color-lacquer-700)]">
              {error}
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-[var(--color-paper-200)] bg-[var(--color-paper-50)] px-7 py-3.5">
          <a
            href={article.articleUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--color-ink-600)] hover:text-[var(--color-accent-500)] transition-colors"
          >
            Đọc bản gốc
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.04em] text-[var(--color-ink-400)]">Esc để đóng</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[var(--color-accent-500)]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}
