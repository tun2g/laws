'use client';

import { useState } from 'react';

export function ToolCallCard({
  name,
  argsText,
  output,
  exitCode,
}: {
  name: string;
  argsText: string;
  output?: string;
  exitCode?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasOutput = Boolean(output && output.length > 0);
  const status: 'running' | 'ok' | 'err' =
    !hasOutput ? 'running' : exitCode === 0 || exitCode === undefined ? 'ok' : 'err';

  const dot =
    status === 'running'
      ? 'bg-[var(--color-brass-500)] pulse-dot'
      : status === 'ok'
        ? 'bg-[var(--color-success-500)]'
        : 'bg-[var(--color-lacquer-500)]';

  return (
    <div className="rounded-[5px] border border-[var(--color-paper-200)] bg-[var(--color-paper-100)]/40 text-[12px] transition-colors">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-[var(--color-paper-100)]/80 transition-colors rounded-[5px]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
          <span className="overline !text-[10px]">Tool</span>
          <span className="font-mono text-[11.5px] text-[var(--color-ink-800)] font-medium">
            {name}
          </span>
          {argsText ? (
            <span className="truncate font-mono text-[11px] text-[var(--color-ink-500)]">
              {argsText.slice(0, 110)}
            </span>
          ) : null}
        </div>
        <ChevronIcon expanded={expanded} />
      </button>

      {expanded ? (
        <div className="border-t border-[var(--color-paper-200)] px-3 py-2.5 space-y-2.5">
          {argsText ? (
            <div>
              <div className="overline !text-[9.5px] mb-1">Tham số</div>
              <pre className="font-mono whitespace-pre-wrap text-[11px] text-[var(--color-ink-700)] leading-relaxed">
                {argsText}
              </pre>
            </div>
          ) : null}
          {hasOutput ? (
            <div>
              <div className="overline !text-[9.5px] mb-1">
                Kết quả {exitCode !== undefined ? `· exit ${exitCode}` : ''}
              </div>
              <pre className="font-mono whitespace-pre-wrap text-[11px] text-[var(--color-ink-800)] leading-relaxed max-h-64 overflow-auto">
                {output}
              </pre>
            </div>
          ) : (
            <div className="italic text-[11px] text-[var(--color-ink-500)]">Đang chạy…</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3.5 w-3.5 text-[var(--color-ink-400)] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
