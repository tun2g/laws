'use client';

import type { CodexLoginEvent, CodexRunEvent, CodexStatusSummary } from '@laws/shared';
import { env } from '@/config/env';
import { readToken } from './api';

/**
 * Opens the device-code login SSE stream against the API. Uses fetch +
 * ReadableStream (not EventSource) so we can attach the JWT Authorization
 * header — EventSource doesn't support custom headers.
 *
 * Caller passes onEvent; returned function aborts the stream.
 */
export function streamCodexLogin(
  onEvent: (e: CodexLoginEvent) => void,
  onError: (msg: string) => void,
): () => void {
  const controller = new AbortController();
  const token = readToken();

  (async () => {
    try {
      const res = await fetch(`${env.apiBaseUrl}/codex/connect/stream`, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        onError(`Codex login failed (HTTP ${res.status})`);
        return;
      }
      await consumeSse(res.body, (line) => {
        try {
          onEvent(JSON.parse(line) as CodexLoginEvent);
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

/**
 * Runs a single Codex turn. Streams JSONL events from the backend SSE.
 */
export function streamCodexRun(
  prompt: string,
  options: { resumeSessionId?: string },
  onEvent: (e: CodexRunEvent) => void,
  onError: (msg: string) => void,
): () => void {
  const controller = new AbortController();
  const token = readToken();

  (async () => {
    try {
      const res = await fetch(`${env.apiBaseUrl}/codex/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt,
          resumeSessionId: options.resumeSessionId,
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        onError(`Codex run failed (HTTP ${res.status})`);
        return;
      }
      await consumeSse(res.body, (line) => {
        try {
          onEvent(JSON.parse(line) as CodexRunEvent);
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

export async function getCodexStatus(): Promise<CodexStatusSummary> {
  const token = readToken();
  const res = await fetch(`${env.apiBaseUrl}/codex/status`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function disconnectCodex(): Promise<void> {
  const token = readToken();
  const res = await fetch(`${env.apiBaseUrl}/codex/connect`, {
    method: 'DELETE',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/**
 * Server-Sent Events are line-delimited; each event ends with a blank line.
 * NestJS @Sse() writes `data: <json>\n\n`. We extract the JSON payload after
 * `data:` and forward one line per event.
 */
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
