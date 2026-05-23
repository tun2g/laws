'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { ChatSessionKind } from '@laws/shared';
import { Button } from '@/components/ui/button';
import { FilePicker } from '@/components/files/file-picker';
import { AttachmentChips, buildMessageWithAttachments } from '@/components/chat/attachment-chips';
import { createChatSession } from '@/lib/chat';
import { readableError } from '@/lib/api';

interface Preset {
  kind: ChatSessionKind;
  label: string;
  description: string;
  hint: string;
}

const PRESETS: Preset[] = [
  {
    kind: 'research',
    label: 'Tra cứu pháp lý',
    description: 'Tư vấn theo VBPL còn hiệu lực, kèm trích dẫn.',
    hint: 'Ví dụ: thủ tục đăng ký nhãn hiệu, quy trình thành lập…',
  },
  {
    kind: 'review',
    label: 'Rà soát dự thảo',
    description: 'Kiểm tra & hiệu chỉnh dự thảo tư vấn.',
    hint: 'Dán dự thảo bạn muốn rà soát, đính kèm bối cảnh.',
  },
  {
    kind: 'translate',
    label: 'Dịch văn bản',
    description: 'Dịch chuyên ngành pháp lý Anh ⇄ Việt.',
    hint: 'Dán đoạn cần dịch, chỉ định ngôn ngữ đích.',
  },
  {
    kind: 'dual-lang',
    label: 'Song ngữ',
    description: 'Bản song ngữ Anh – Việt cạnh nhau.',
    hint: 'Phù hợp cho hợp đồng, công văn quốc tế.',
  },
  {
    kind: 'free',
    label: 'Hỏi tự do',
    description: 'Chat tự do, không khuôn mẫu cố định.',
    hint: 'Cho các câu hỏi nhanh hoặc bối cảnh đặc thù.',
  },
];

export function NewChatModal({
  projectId,
  open,
  onClose,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<ChatSessionKind>('research');
  const [firstMessage, setFirstMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const active = PRESETS.find((p) => p.kind === kind) ?? PRESETS[0]!;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstMessage.trim()) return;
    setLoading(true);
    try {
      const body = buildMessageWithAttachments(firstMessage.trim(), attachments);
      const res = await createChatSession({ projectId, kind, firstMessage: body });
      onClose();
      router.push(`/projects/${projectId}/chat/${res.sessionId}` as never);
    } catch (err) {
      toast.error(readableError(err, 'Không tạo được phiên chat'));
      setLoading(false);
    }
  };

  const removeAttachment = (p: string) =>
    setAttachments((prev) => prev.filter((x) => x !== p));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink-900)]/60 backdrop-blur-sm px-4 py-8 paper-fade-up"
      onClick={onClose}
    >
      <form
        className="w-full max-w-2xl bg-[var(--color-paper-0)] shadow-[var(--shadow-paper-lg)] rounded-[8px] border border-[var(--color-paper-200)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className="border-b border-[var(--color-paper-200)] px-7 py-5">
          <div className="overline">Mở phiên mới</div>
          <h2
            className="mt-1.5 font-serif text-[24px] tracking-[-0.02em] text-[var(--color-ink-900)]"
            style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 36, 'wght' 500" }}
          >
            Cuộc trò chuyện mới
          </h2>
          <p className="mt-1 text-[12.5px] text-[var(--color-ink-500)]">
            Chọn loại tác vụ, nhập câu hỏi đầu tiên — vẫn có thể chat tiếp để mở rộng.
          </p>
        </div>

        <div className="px-7 py-6 space-y-6">
          <div>
            <div className="overline mb-2.5">Loại tác vụ</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PRESETS.map((p) => {
                const selected = kind === p.kind;
                return (
                  <button
                    key={p.kind}
                    type="button"
                    onClick={() => setKind(p.kind)}
                    className={`group text-left rounded-[5px] border px-4 py-3 transition-all duration-150 ${
                      selected
                        ? 'border-[var(--color-accent-500)] bg-[var(--color-accent-500)]/5 ring-[2.5px] ring-[var(--color-accent-500)]/15'
                        : 'border-[var(--color-paper-200)] bg-[var(--color-paper-0)] hover:border-[var(--color-paper-300)] hover:bg-[var(--color-paper-100)]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`font-serif text-[14.5px] tracking-[-0.005em] ${selected ? 'text-[var(--color-accent-500)]' : 'text-[var(--color-ink-900)]'}`}
                        style={{ fontVariationSettings: "'SOFT' 80, 'opsz' 20, 'wght' 550" }}
                      >
                        {p.label}
                      </div>
                      {selected ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--color-accent-500)]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="m20 6-11 11-5-5" />
                        </svg>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-[11.5px] leading-snug text-[var(--color-ink-500)]">
                      {p.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="overline mb-2 block" htmlFor="first-message">
              Câu hỏi / yêu cầu đầu tiên
            </label>

            {attachments.length > 0 ? (
              <AttachmentChips
                paths={attachments}
                onRemove={removeAttachment}
                className="mb-2"
              />
            ) : null}

            <textarea
              id="first-message"
              ref={textareaRef}
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              rows={5}
              placeholder={active.hint}
              required
              className="block w-full rounded-[5px] border border-[var(--color-paper-300)] bg-[var(--color-paper-0)] px-3.5 py-2.5 text-[14px] leading-relaxed text-[var(--color-ink-900)] outline-none transition-all duration-150 placeholder:text-[var(--color-ink-400)] focus:border-[var(--color-accent-500)] focus:ring-[3px] focus:ring-[var(--color-accent-500)]/15 resize-y"
            />
            <div className="mt-1.5 flex items-center justify-between text-[10.5px] tracking-[0.04em] uppercase text-[var(--color-ink-400)]">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-[5px] px-1.5 py-0.5 text-[11px] !normal-case tracking-normal text-[var(--color-accent-500)] hover:bg-[var(--color-accent-500)]/8"
              >
                <PaperclipIcon /> Đính kèm tệp
              </button>
              <span className="tabular">{firstMessage.length.toLocaleString('vi-VN')} ký tự</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--color-paper-200)] bg-[var(--color-paper-50)] px-7 py-4">
          <span className="overline">Esc để đóng</span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" loading={loading} disabled={!firstMessage.trim()}>
              Bắt đầu phiên
            </Button>
          </div>
        </div>
      </form>

      <FilePicker
        projectId={projectId}
        open={pickerOpen}
        initial={attachments}
        onClose={() => setPickerOpen(false)}
        onConfirm={(paths) => setAttachments(paths)}
      />
    </div>
  );
}

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21.4 11.05 12.5 19.95a5.5 5.5 0 0 1-7.78-7.78L13.6 3.27a3.67 3.67 0 0 1 5.19 5.19L9.9 17.35a1.83 1.83 0 1 1-2.59-2.59L15.34 6.7" />
    </svg>
  );
}
