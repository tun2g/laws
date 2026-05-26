'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/app-shell';
import { MessageBubble } from '@/components/chat/message-bubble';
import {
  appendChatMessage,
  deleteChatSession,
  getChatSession,
  streamChatTurn,
} from '@/lib/chat';
import { readableError } from '@/lib/api';
import { applyStreamEventToAssistant } from '@/components/chat/apply-stream-event';
import { buildMessageWithAttachments } from '@/components/chat/attachment-chips';
import { ChatHeader } from '@/components/chat/chat-header';
import { ChatComposer } from '@/components/chat/chat-composer';
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
      <div className="mx-auto -mb-8 flex h-[calc(100vh-6.5rem)] max-w-5xl flex-col">
        <ChatHeader
          projectId={projectId}
          session={session}
          onDelete={() => setConfirmingDelete(true)}
        />

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-1 py-5 space-y-5 paper-stagger"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2.5 py-12 text-[13px] text-ink-500">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500 pulse-dot" />
              Đang tải tin nhắn…
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span
                aria-hidden
                className="font-serif text-[28px] italic text-paper-300"
                style={{ fontVariationSettings: "'opsz' 60, 'SOFT' 100, 'wght' 400" }}
              >
                ⁂
              </span>
              <p className="text-[12.5px] text-ink-500">Chưa có tin nhắn.</p>
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
        </div>

        <ChatComposer
          value={composer}
          onChange={setComposer}
          onSubmit={onSend}
          onAttachClick={() => setPickerOpen(true)}
          attachments={attachments}
          onRemoveAttachment={(p) => setAttachments((prev) => prev.filter((x) => x !== p))}
          sending={sending}
          streaming={Boolean(streamingAssistantId)}
        />
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

