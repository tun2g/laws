'use client';

import type {
  ChatMessage,
  ChatSession,
  ChatSessionKind,
  ChatStreamEvent,
} from '@laws/shared';
import { env } from '@/config/env';
import { api, readToken } from './api';

export async function listChatSessions(projectId: string): Promise<ChatSession[]> {
  const { data } = await api.get<ChatSession[]>('/chat/sessions', { params: { projectId } });
  return data;
}

export async function createChatSession(input: {
  projectId: string;
  kind: ChatSessionKind;
  firstMessage: string;
}): Promise<{ sessionId: string; userMessageId: string; assistantMessageId: string }> {
  const { data } = await api.post('/chat/sessions', input);
  return data;
}

export async function getChatSession(sessionId: string): Promise<{
  session: ChatSession;
  messages: ChatMessage[];
}> {
  const { data } = await api.get(`/chat/sessions/${sessionId}`);
  return data;
}

export async function appendChatMessage(
  sessionId: string,
  content: string,
): Promise<{ userMessageId: string; assistantMessageId: string }> {
  const { data } = await api.post(`/chat/sessions/${sessionId}/messages`, { content });
  return data;
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await api.delete(`/chat/sessions/${sessionId}`);
}

/**
 * Opens the SSE stream for a single assistant turn. Returns an abort fn.
 * Uses fetch + ReadableStream (not EventSource) so we can attach the JWT
 * header — EventSource doesn't support custom headers.
 */
export function streamChatTurn(
  sessionId: string,
  assistantMessageId: string,
  onEvent: (e: ChatStreamEvent) => void,
  onError: (msg: string) => void,
): () => void {
  const controller = new AbortController();
  const token = readToken();

  (async () => {
    try {
      const res = await fetch(
        `${env.apiBaseUrl}/chat/sessions/${sessionId}/messages/${assistantMessageId}/stream`,
        {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        },
      );
      if (!res.ok || !res.body) {
        onError(`Chat stream failed (HTTP ${res.status})`);
        return;
      }
      await consumeSse(res.body, (jsonPayload) => {
        try {
          onEvent(JSON.parse(jsonPayload) as ChatStreamEvent);
        } catch {
          // Skip unparseable lines.
        }
      });
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      onError((err as Error).message);
    }
  })();

  return () => controller.abort();
}

async function consumeSse(
  body: ReadableStream<Uint8Array>,
  onLine: (jsonPayload: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buf.indexOf('\n\n')) >= 0) {
      const block = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      for (const raw of block.split('\n')) {
        const line = raw.trim();
        if (line.startsWith('data:')) {
          onLine(line.slice(5).trim());
        }
      }
    }
  }
}
