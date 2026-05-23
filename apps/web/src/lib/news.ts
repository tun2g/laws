'use client';

import type { NewsPage, NewsSource, NewsSourceId, NewsSummaryEvent } from '@laws/shared';
import { env } from '@/config/env';
import { api, readToken } from './api';

export async function listNewsSources(): Promise<NewsSource[]> {
  const { data } = await api.get<NewsSource[]>('/news/sources');
  return data;
}

export async function fetchNewsPage(opts: {
  page: number;
  pageSize: number;
  source?: NewsSourceId;
}): Promise<NewsPage> {
  const { data } = await api.get<NewsPage>('/news', {
    params: {
      page: opts.page,
      pageSize: opts.pageSize,
      source: opts.source,
    },
  });
  return data;
}

export async function refreshNews(): Promise<void> {
  await api.post('/news/refresh');
}

/**
 * Opens an SSE stream that emits a Codex-generated summary of the article.
 * Returns an abort fn. No caching server-side — every call spends Codex
 * quota.
 */
export function streamNewsSummary(
  articleId: string,
  onEvent: (e: NewsSummaryEvent) => void,
  onError: (msg: string) => void,
): () => void {
  const controller = new AbortController();
  const token = readToken();

  (async () => {
    try {
      const res = await fetch(
        `${env.apiBaseUrl}/news/${articleId}/summarize/stream`,
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
        onError(`Tóm tắt thất bại (HTTP ${res.status})`);
        return;
      }
      await consumeSse(res.body, (jsonPayload) => {
        try {
          onEvent(JSON.parse(jsonPayload) as NewsSummaryEvent);
        } catch {
          // skip
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
