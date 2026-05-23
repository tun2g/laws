'use client';

import { cn } from '@/lib/cn';

interface Props {
  paths: string[];
  onRemove: (path: string) => void;
  className?: string;
}

/** Row of removable chips shown above the message composer. */
export function AttachmentChips({ paths, onRemove, className }: Props) {
  if (paths.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {paths.map((p) => (
        <span
          key={p}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-accent-500)]/30 bg-[var(--color-accent-500)]/8 pl-2 pr-1 py-0.5 text-[11.5px] text-[var(--color-accent-700)]"
        >
          <PaperclipIcon />
          <span className="font-mono">{p}</span>
          <button
            type="button"
            onClick={() => onRemove(p)}
            className="rounded-full p-0.5 hover:bg-[var(--color-accent-500)]/15"
            aria-label={`Bỏ đính kèm ${p}`}
          >
            <CloseIcon />
          </button>
        </span>
      ))}
    </div>
  );
}

/**
 * Prepend a "[Đính kèm]" reference block to the message body so Codex sees
 * which workspace files/folders to consult. Empty list → returns raw text.
 */
export function buildMessageWithAttachments(text: string, paths: string[]): string {
  if (paths.length === 0) return text;
  const block = ['[Đính kèm]', ...paths.map((p) => `- ${p}`)].join('\n');
  return `${block}\n\n${text}`;
}

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21.4 11.05 12.5 19.95a5.5 5.5 0 0 1-7.78-7.78L13.6 3.27a3.67 3.67 0 0 1 5.19 5.19L9.9 17.35a1.83 1.83 0 1 1-2.59-2.59L15.34 6.7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
