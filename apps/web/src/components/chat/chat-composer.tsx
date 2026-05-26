'use client';

import { Button } from '@/components/ui/button';
import { AttachmentChips } from './attachment-chips';

interface Props {
  value: string;
  onChange: (next: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAttachClick: () => void;
  attachments: string[];
  onRemoveAttachment: (path: string) => void;
  sending: boolean;
  streaming: boolean;
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onAttachClick,
  attachments,
  onRemoveAttachment,
  sending,
  streaming,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="pt-2">
      <div aria-hidden className="mb-2 flex items-center gap-3 text-paper-300">
        <span className="h-px flex-1 bg-linear-to-r from-transparent via-paper-300 to-transparent" />
        <span
          className="font-serif text-[11px] italic"
          style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 100, 'wght' 400" }}
        >
          ⁂
        </span>
        <span className="h-px flex-1 bg-linear-to-r from-transparent via-paper-300 to-transparent" />
      </div>

      {attachments.length > 0 ? (
        <AttachmentChips paths={attachments} onRemove={onRemoveAttachment} className="mb-1.5 px-1" />
      ) : null}

      <div className="group flex items-center gap-1.5 rounded-[7px] border border-paper-300 bg-paper-0 px-1.5 py-1 transition-all duration-150 focus-within:border-accent-500 focus-within:ring-[3px] focus-within:ring-accent-500/15">
        <button
          type="button"
          onClick={onAttachClick}
          disabled={streaming}
          title="Đính kèm tệp"
          className="rounded-[5px] p-1.5 text-ink-500 hover:bg-paper-100 hover:text-accent-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Đính kèm tệp"
        >
          <PaperclipIcon />
        </button>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit(e as unknown as React.FormEvent);
            }
          }}
          rows={1}
          disabled={streaming}
          placeholder={
            streaming
              ? 'Đang chờ Codex trả lời…'
              : 'Nhập câu hỏi tiếp theo…  ⌘/Ctrl + Enter để gửi'
          }
          className="flex-1 resize-none bg-transparent px-1.5 py-1.5 text-[13.5px] leading-snug text-ink-900 outline-none placeholder:text-ink-400 max-h-32"
        />
        <Button type="submit" size="sm" loading={sending} disabled={!value.trim() || streaming}>
          <span>Gửi</span>
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Button>
      </div>

      <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] uppercase tracking-[0.04em] text-ink-400">
        <span>Mỗi tin nhắn dùng tài khoản Codex của bạn.</span>
        <span className="tabular">{value.length.toLocaleString('vi-VN')} ký tự</span>
      </div>
    </form>
  );
}

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21.4 11.05 12.5 19.95a5.5 5.5 0 0 1-7.78-7.78L13.6 3.27a3.67 3.67 0 0 1 5.19 5.19L9.9 17.35a1.83 1.83 0 1 1-2.59-2.59L15.34 6.7" />
    </svg>
  );
}
