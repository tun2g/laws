'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '@laws/shared';
import { ReasoningBlock } from './reasoning-block';
import { ToolCallCard } from './tool-call-card';

const AssistantSeal = () => (
  <div
    aria-hidden
    className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-paper-300)] bg-[var(--color-paper-0)] text-[var(--color-accent-500)]"
  >
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7c2 0 3-2 5-2s3 2 5 2 3-2 5-2v12c-2 0-3 2-5 2s-3-2-5-2-3 2-5 2V7Z" />
      <path d="M9 11h6M9 14h4" />
    </svg>
  </div>
);

const UserAvatar = ({ initial }: { initial: string }) => (
  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink-900)] text-[11px] font-medium text-[var(--color-paper-0)]">
    {initial}
  </div>
);

export function MessageBubble({
  message,
  userInitial = 'B',
}: {
  message: ChatMessage;
  userInitial?: string;
}) {
  if (message.role === 'user') {
    return (
      <div className="paper-fade-up flex items-start justify-end gap-3">
        <div className="max-w-[78%] rounded-[10px] rounded-tr-[3px] bg-[var(--color-ink-900)] px-4 py-2.5 text-[14px] leading-relaxed text-[var(--color-paper-0)] whitespace-pre-wrap shadow-[var(--shadow-paper)]">
          {message.content}
        </div>
        <UserAvatar initial={userInitial} />
      </div>
    );
  }

  const isStreaming = message.status === 'streaming' || message.status === 'pending';
  const hasEvents = (message.events?.length ?? 0) > 0;

  return (
    <div className="paper-fade-up flex items-start gap-3">
      <AssistantSeal />
      <div className="min-w-0 flex-1 max-w-[88%] space-y-2">
        {hasEvents ? (
          <div className="space-y-1.5">
            {message.events?.map((event, i) => {
              if (event.type === 'reasoning') {
                return <ReasoningBlock key={i} text={event.text} />;
              }
              if (event.type === 'tool_call') {
                return (
                  <ToolCallCard
                    key={event.toolCallId}
                    name={event.name}
                    argsText={event.argsText}
                    output={event.output}
                    exitCode={event.exitCode}
                  />
                );
              }
              if (event.type === 'file_change') {
                return (
                  <div
                    key={i}
                    className="rounded-[5px] border border-[var(--color-accent-500)]/25 bg-[var(--color-accent-500)]/5 px-3 py-2 text-[12px]"
                  >
                    <div className="flex items-center gap-2 font-mono text-[var(--color-accent-700)]">
                      <ChangeIcon kind={event.change} />
                      <span>{event.path}</span>
                      <span className="overline ml-auto !text-[10px]">{event.change}</span>
                    </div>
                    {event.diff ? (
                      <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap font-mono text-[10.5px] leading-snug text-[var(--color-ink-800)]">
                        {event.diff}
                      </pre>
                    ) : null}
                  </div>
                );
              }
              return null;
            })}
          </div>
        ) : null}

        {message.content ? (
          <div className="paper-card relative px-5 py-4">
            <span
              aria-hidden
              className="absolute -left-px top-3 bottom-3 w-[2px] rounded-full bg-[var(--color-accent-500)]/40"
            />
            <div className="chat-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              {isStreaming ? <span className="caret" aria-hidden /> : null}
            </div>
          </div>
        ) : isStreaming ? (
          <ThinkingIndicator />
        ) : null}

        {message.status === 'failed' && message.errorMessage ? (
          <div className="rounded-[5px] border border-[var(--color-lacquer-500)]/30 bg-[var(--color-lacquer-50)] px-3 py-2 text-[12px] text-[var(--color-lacquer-700)]">
            {message.errorMessage}
          </div>
        ) : null}

        {message.tokenUsage && message.status === 'complete' ? (
          <div className="flex items-center gap-3 pt-0.5 text-[10.5px] tracking-[0.04em] text-[var(--color-ink-400)] uppercase">
            <span className="tabular">
              {message.tokenUsage.toLocaleString('vi-VN')} tokens
            </span>
            <span aria-hidden className="h-px w-6 bg-[var(--color-paper-300)]" />
            <span>Hoàn tất</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="paper-card inline-flex items-center gap-2.5 px-4 py-3 text-[13px] text-[var(--color-ink-500)]">
      <span className="flex gap-1" aria-hidden>
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-500)] pulse-dot" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-500)] pulse-dot" style={{ animationDelay: '200ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-500)] pulse-dot" style={{ animationDelay: '400ms' }} />
      </span>
      Codex đang suy nghĩ…
    </div>
  );
}

function ChangeIcon({ kind }: { kind: 'create' | 'modify' | 'delete' }) {
  const stroke = 'currentColor';
  if (kind === 'create') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }
  if (kind === 'delete') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round">
        <path d="M5 12h14" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}
