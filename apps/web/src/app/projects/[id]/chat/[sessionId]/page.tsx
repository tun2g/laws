'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { MessageBubble } from '@/components/chat/message-bubble';
import {
  appendChatMessage,
  deleteChatSession,
  getChatSession,
  streamChatTurn,
} from '@/lib/chat';
import { readableError } from '@/lib/api';
import { applyStreamEventToAssistant } from '@/components/chat/apply-stream-event';
import { AttachmentChips, buildMessageWithAttachments } from '@/components/chat/attachment-chips';
import { ChatHeader } from '@/components/chat/chat-header';
import { FilePicker } from '@/components/files/file-picker';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { ChatMessage, ChatSession } from '@laws/shared';

export default function ChatPage() {
  const params = useParams<{ id: string; sessionId: string }>();
  const projectId = params.id;
  const sessionId = params.sessionId;

  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const streamingAssistantId = useMemo(
    () =>
      messages.find((m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming'))
        ?.id ?? null,
    [messages],
  );

  const applyEventToAssistant = useCallback(
    (assistantId: string, mutate: (m: ChatMessage) => ChatMessage) => {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? mutate(m) : m)));
    },
    [],
  );

  const openStream = useCallback(
    (assistantId: string) => {
      abortRef.current?.();
      const stop = streamChatTurn(
        sessionId,
        assistantId,
        (event) => {
          if (event.type === 'done') {
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? event.message : m)));
            setSession(event.session);
            abortRef.current = null;
            return;
          }
          if (event.type === 'error') {
            applyEventToAssistant(assistantId, (m) => ({
              ...m,
              status: 'failed',
              errorMessage: event.message,
            }));
            toast.error(event.message);
            abortRef.current = null;
            return;
          }
          applyEventToAssistant(assistantId, (m) => applyStreamEventToAssistant(m, event) ?? m);
        },
        (msg) => {
          applyEventToAssistant(assistantId, (m) => ({
            ...m,
            status: 'failed',
            errorMessage: msg,
          }));
          toast.error(msg);
          abortRef.current = null;
        },
      );
      abortRef.current = stop;
    },
    [sessionId, applyEventToAssistant],
  );

  // Initial load — fetch session + messages, then resume any streaming
  // assistant message via SSE.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getChatSession(sessionId)
      .then(({ session: s, messages: ms }) => {
        if (cancelled) return;
        setSession(s);
        setMessages(ms);
        const pending = ms.find(
          (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming'),
        );
        if (pending) openStream(pending.id);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(readableError(err, 'Không tải được phiên chat'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      abortRef.current?.();
    };
  }, [sessionId, openStream]);

  // Auto-scroll on new content.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = composer.trim();
    if (!text || sending || streamingAssistantId) return;
    setSending(true);
    try {
      const body = buildMessageWithAttachments(text, attachments);
      const res = await appendChatMessage(sessionId, body);
      const now = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        {
          id: res.userMessageId,
          sessionId,
          role: 'user',
          content: body,
          events: null,
          tokenUsage: null,
          status: 'complete',
          errorMessage: null,
          createdAt: now,
          finishedAt: now,
        },
        {
          id: res.assistantMessageId,
          sessionId,
          role: 'assistant',
          content: '',
          events: [],
          tokenUsage: null,
          status: 'pending',
          errorMessage: null,
          createdAt: now,
          finishedAt: null,
        },
      ]);
      setComposer('');
      setAttachments([]);
      openStream(res.assistantMessageId);
    } catch (err) {
      toast.error(readableError(err, 'Gửi tin nhắn thất bại'));
    } finally {
      setSending(false);
    }
  };

  const doDelete = async () => {
    setConfirmingDelete(false);
    try {
      await deleteChatSession(sessionId);
      window.location.href = `/projects/${projectId}`;
    } catch (err) {
      toast.error(readableError(err, 'Xóa thất bại'));
    }
  };

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-4xl flex-col">
        <ChatHeader
          projectId={projectId}
          session={session}
          onDelete={() => setConfirmingDelete(true)}
        />

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-1 py-7 space-y-5 paper-stagger"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2.5 py-12 text-[13px] text-[var(--color-ink-500)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-500)] pulse-dot" />
              Đang tải tin nhắn…
            </div>
          ) : messages.length === 0 ? (
            <p className="py-12 text-center text-[13px] text-[var(--color-ink-500)]">Chưa có tin nhắn.</p>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
        </div>

        <form onSubmit={onSend} className="border-t border-[var(--color-paper-200)] pt-4 pb-2">
          {attachments.length > 0 ? (
            <AttachmentChips
              paths={attachments}
              onRemove={(p) => setAttachments((prev) => prev.filter((x) => x !== p))}
              className="mb-2 px-1"
            />
          ) : null}
          <div className="group flex items-end gap-2 rounded-[8px] border border-[var(--color-paper-300)] bg-[var(--color-paper-0)] p-2 shadow-[var(--shadow-paper)] transition-all duration-150 focus-within:border-[var(--color-accent-500)] focus-within:ring-[3px] focus-within:ring-[var(--color-accent-500)]/15">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              disabled={Boolean(streamingAssistantId)}
              title="Đính kèm tệp"
              className="self-end mb-1 rounded-[5px] p-1.5 text-[var(--color-ink-500)] hover:bg-[var(--color-paper-100)] hover:text-[var(--color-accent-500)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Đính kèm tệp"
            >
              <ComposerPaperclipIcon />
            </button>
            <textarea
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void onSend(e as unknown as React.FormEvent);
                }
              }}
              rows={2}
              disabled={Boolean(streamingAssistantId)}
              placeholder={
                streamingAssistantId
                  ? 'Đang chờ Codex trả lời…'
                  : 'Nhập câu hỏi tiếp theo…  ⌘/Ctrl + Enter để gửi'
              }
              className="flex-1 resize-none bg-transparent px-2 py-2 text-[14px] leading-relaxed text-[var(--color-ink-900)] outline-none placeholder:text-[var(--color-ink-400)]"
            />
            <Button
              type="submit"
              loading={sending}
              disabled={!composer.trim() || Boolean(streamingAssistantId)}
            >
              <span>Gửi</span>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-[10.5px] uppercase tracking-[0.04em] text-[var(--color-ink-400)]">
            <span>Mỗi tin nhắn dùng tài khoản Codex của bạn.</span>
            <span className="tabular">{composer.length.toLocaleString('vi-VN')} ký tự</span>
          </div>
        </form>
      </div>

      <FilePicker
        projectId={projectId}
        open={pickerOpen}
        initial={attachments}
        onClose={() => setPickerOpen(false)}
        onConfirm={(paths) => setAttachments(paths)}
      />

      <ConfirmDialog
        open={confirmingDelete}
        title="Xóa cuộc trò chuyện?"
        description="Toàn bộ tin nhắn trong phiên này sẽ bị xóa vĩnh viễn."
        confirmLabel="Xóa"
        destructive
        onConfirm={doDelete}
        onClose={() => setConfirmingDelete(false)}
      />
    </AppShell>
  );
}

function ComposerPaperclipIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21.4 11.05 12.5 19.95a5.5 5.5 0 0 1-7.78-7.78L13.6 3.27a3.67 3.67 0 0 1 5.19 5.19L9.9 17.35a1.83 1.83 0 1 1-2.59-2.59L15.34 6.7" />
    </svg>
  );
}

