'use client';

import { useState } from 'react';

export function ReasoningBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-[5px] border border-dashed border-[var(--color-paper-300)] bg-[var(--color-paper-0)] text-[12px]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-[var(--color-paper-100)]/60 transition-colors rounded-[5px]"
      >
        <span className="flex items-center gap-2.5 text-[var(--color-ink-600)]">
          <ThoughtIcon />
          <span className="overline !text-[10px]">Suy luận nội bộ</span>
        </span>
        <span className="text-[11px] text-[var(--color-ink-400)]">
          {expanded ? 'Ẩn' : `Xem · ${text.length.toLocaleString('vi-VN')} ký tự`}
        </span>
      </button>
      {expanded ? (
        <div className="border-t border-dashed border-[var(--color-paper-300)] px-3 py-2.5">
          <p
            className="font-serif italic whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--color-ink-600)]"
            style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 80, 'wght' 380" }}
          >
            {text}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ThoughtIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 13.5C9 11 11 9 13.5 9S18 11 18 13.5c0 1.4-.6 2.6-1.6 3.4L16 19l-1.5-.8H13a4.5 4.5 0 0 1-4-2.4" />
      <path d="M6 12.5C6 10 7.5 8 10 8" opacity="0.5" />
      <circle cx="13" cy="13" r="0.6" fill="currentColor" />
      <circle cx="15" cy="13" r="0.6" fill="currentColor" />
    </svg>
  );
}
