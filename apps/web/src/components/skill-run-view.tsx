'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, readToken, readableError } from '@/lib/api';
import { env } from '@/config/env';
import type { Citation, SkillRun, SkillRunStatus } from '@laws/shared';

const STATUS_LABEL: Record<SkillRunStatus, string> = {
  QUEUED: 'Chờ chạy',
  RUNNING: 'Đang chạy',
  DONE: 'Hoàn tất',
  FAILED: 'Lỗi',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLOR: Record<SkillRunStatus, string> = {
  QUEUED: 'bg-[var(--color-ink-100)] text-[var(--color-ink-700)]',
  RUNNING: 'bg-amber-50 text-[var(--color-warning-500)]',
  DONE: 'bg-green-50 text-[var(--color-success-500)]',
  FAILED: 'bg-red-50 text-[var(--color-danger-500)]',
  CANCELLED: 'bg-[var(--color-ink-100)] text-[var(--color-ink-500)]',
};

export function SkillRunView({ runId, autoStart }: { runId: string; autoStart: boolean }) {
  const [run, setRun] = useState<SkillRun | null>(null);
  const [output, setOutput] = useState('');
  const [sideOutput, setSideOutput] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load initial state
  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get<SkillRun>(`/skills/runs/${runId}`);
        setRun(data);
        if (data.output) setOutput(data.output);
        if (data.sideOutput) setSideOutput(data.sideOutput);
        if (data.citations) setCitations(data.citations as Citation[]);
      } catch (err) {
        toast.error(readableError(err, 'Không tải được phiên'));
      }
    }
    load();
  }, [runId]);

  useEffect(() => {
    if (autoStart && run?.status === 'QUEUED' && !hasStarted) {
      void start();
    }
    return () => {
      eventSourceRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, run, hasStarted]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  async function start() {
    if (streaming || !run) return;
    setHasStarted(true);
    setStreaming(true);
    setOutput('');
    setSideOutput(null);
    setCitations([]);

    const token = readToken();
    const url = new URL(`${env.apiBaseUrl}/skills/runs/${runId}/stream`);
    if (token) url.searchParams.set('access_token', token);

    // EventSource doesn't support custom headers, so we authenticate via query param.
    // (See README — the API exposes a public-but-signed alternative if you prefer.)
    const es = new EventSource(url.toString(), { withCredentials: true });
    eventSourceRef.current = es;

    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data);
        if (event.type === 'token') {
          setOutput((prev) => prev + event.text);
        } else if (event.type === 'citation') {
          setCitations((prev) => [...prev, event.citation]);
        } else if (event.type === 'status') {
          setRun((r) => (r ? { ...r, status: event.status } : r));
        } else if (event.type === 'done') {
          setRun(event.task);
          if (event.task.sideOutput) setSideOutput(event.task.sideOutput);
          setStreaming(false);
          es.close();
          toast.success('Hoàn tất');
        } else if (event.type === 'error') {
          toast.error(event.message);
          setStreaming(false);
          es.close();
        }
      } catch {
        /* ignore malformed event */
      }
    };

    es.onerror = () => {
      setStreaming(false);
      es.close();
    };
  }

  if (!run) {
    return <p className="text-sm text-[var(--color-ink-500)]">Đang tải…</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={`Phiên ${run.kind}`}
          description={
            <>
              Tạo lúc {new Date(run.createdAt).toLocaleString('vi-VN')}
              {run.tokenUsage ? ` · ${run.tokenUsage.toLocaleString()} tokens` : ''}
            </>
          }
          actions={
            <>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${STATUS_COLOR[run.status]}`}
              >
                {STATUS_LABEL[run.status]}
              </span>
              {(run.status === 'QUEUED' || run.status === 'FAILED') && !streaming && (
                <Button size="sm" onClick={start}>
                  {run.status === 'FAILED' ? 'Chạy lại' : 'Bắt đầu'}
                </Button>
              )}
            </>
          }
        />
        <CardBody>
          <details className="text-sm">
            <summary className="cursor-pointer text-[var(--color-ink-600)]">
              Đầu vào ({run.input.length.toLocaleString()} ký tự)
            </summary>
            <pre className="mt-3 whitespace-pre-wrap rounded-md bg-[var(--color-ink-50)] p-3 text-xs leading-relaxed text-[var(--color-ink-700)]">
              {run.input}
            </pre>
          </details>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Kết quả"
          actions={
            output ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(output);
                    toast.success('Đã sao chép Markdown');
                  }}
                >
                  Sao chép Markdown
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => downloadMarkdown(output, `${run.kind}-${run.id}.md`)}
                >
                  Tải .md
                </Button>
              </>
            ) : null
          }
        />
        <CardBody>
          {output ? (
            <div
              ref={outputRef}
              className="prose-legal max-h-[60vh] overflow-y-auto rounded-md border border-[var(--color-ink-100)] bg-white p-6"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-ink-500)]">
              {streaming
                ? 'Codex đang nghĩ — kết quả sẽ xuất hiện trong vài giây.'
                : run.status === 'QUEUED'
                  ? 'Nhấn “Bắt đầu” để Codex chạy phiên này.'
                  : 'Chưa có kết quả.'}
            </p>
          )}
        </CardBody>
      </Card>

      {sideOutput ? (
        <Card>
          <CardHeader
            title={run.kind === 'review' ? 'Change log' : 'Ghi chú bổ sung'}
          />
          <CardBody>
            <div className="prose-legal max-h-[40vh] overflow-y-auto rounded-md border border-[var(--color-ink-100)] bg-white p-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{sideOutput}</ReactMarkdown>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {citations.length > 0 ? (
        <Card>
          <CardHeader title={`Trích dẫn (${citations.length})`} />
          <CardBody>
            <ul className="space-y-2 text-sm">
              {citations.map((c, i) => (
                <li key={i}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--color-accent-600)] underline-offset-2 hover:underline"
                  >
                    {c.title || c.url}
                  </a>
                  {c.snippet ? (
                    <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">{c.snippet}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

function downloadMarkdown(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
