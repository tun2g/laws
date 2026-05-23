'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/components/auth/auth-layout';
import { getCodexStatus, streamCodexLogin } from '@/lib/codex';
import { useAuth } from '@/lib/auth-store';

type Stage =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'waiting-for-code' }
  | { kind: 'awaiting-user'; verificationUrl: string; userCode: string }
  | { kind: 'connected' }
  | { kind: 'error'; message: string };

export default function ConnectCodexPage() {
  const router = useRouter();
  const refresh = useAuth((s) => s.refresh);
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const [codeCopied, setCodeCopied] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.();
    abortRef.current = null;
  }, []);

  const start = useCallback(() => {
    stop();
    setStage({ kind: 'starting' });
    setCodeCopied(false);
    abortRef.current = streamCodexLogin(
      (event) => {
        if (event.type === 'starting') {
          setStage({ kind: 'waiting-for-code' });
        } else if (event.type === 'awaiting-user') {
          setStage({
            kind: 'awaiting-user',
            verificationUrl: event.verificationUrl,
            userCode: event.userCode,
          });
        } else if (event.type === 'connected') {
          setStage({ kind: 'connected' });
          refresh()
            .then(() => {
              toast.success('Đã kết nối Codex');
              router.push('/dashboard');
            })
            .catch(() => {
              router.push('/dashboard');
            });
        } else if (event.type === 'error') {
          setStage({ kind: 'error', message: event.message });
        }
      },
      (message) => setStage({ kind: 'error', message }),
    );
  }, [stop, refresh, router]);

  useEffect(() => {
    let cancelled = false;
    // Skip the SSE entirely if the user is already connected. Avoids spawning
    // a pointless second `codex login` (which would overwrite auth.json on
    // completion) when the user lands here while already authenticated.
    getCodexStatus()
      .then(({ connected }) => {
        if (cancelled) return;
        if (connected) {
          router.replace('/dashboard');
          return;
        }
        start();
      })
      .catch(() => {
        // If status check fails (e.g. token expired), let the stream attempt
        // run — backend will return the appropriate auth error.
        if (!cancelled) start();
      });
    return () => {
      cancelled = true;
      stop();
    };
    // start/stop are stable; intentionally run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthLayout
      overline="Kết nối Codex"
      title={
        <>
          Liên kết
          <br />
          <span className="italic text-[var(--color-accent-500)]">Codex CLI.</span>
        </>
      }
      subtitle="Mọi phiên tra cứu, rà soát, dịch chạy trên tài khoản ChatGPT/Codex của riêng bạn. Không dùng chung tài khoản, không API key chia sẻ."
    >
      <div className="paper-card p-6">
        {stage.kind === 'idle' || stage.kind === 'starting' ? (
          <StatusRow tone="working">Đang khởi tạo phiên đăng nhập Codex…</StatusRow>
        ) : null}

        {stage.kind === 'waiting-for-code' ? (
          <StatusRow tone="working">
            Codex CLI đã chạy — đang chờ máy chủ OpenAI cấp mã thiết bị…
          </StatusRow>
        ) : null}

        {stage.kind === 'awaiting-user' ? (
          <div className="space-y-6">
            <ol className="space-y-2.5 text-[13.5px] text-[var(--color-ink-700)]">
              {STEPS.map((label, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    aria-hidden
                    className="flex h-5 w-5 shrink-0 items-center justify-center font-serif text-[11px] text-[var(--color-accent-500)] tabular"
                    style={{ fontVariationSettings: "'opsz' 9, 'wght' 600" }}
                  >
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ol>

            <hr className="rule" />

            <div className="space-y-3">
              <div className="overline">Mở liên kết</div>
              <a
                href={stage.verificationUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between gap-3 rounded-[6px] border border-[var(--color-accent-500)]/30 bg-[var(--color-accent-500)]/5 px-4 py-3 text-[13.5px] font-medium text-[var(--color-accent-700)] hover:bg-[var(--color-accent-500)]/10 transition-colors"
              >
                <span className="truncate font-mono">{stage.verificationUrl}</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </a>
            </div>

            <div className="space-y-2">
              <div className="overline">Mã xác thực</div>
              <div className="flex items-center gap-3 rounded-[6px] border-2 border-dashed border-[var(--color-paper-300)] bg-[var(--color-paper-50)] px-5 py-4">
                <div className="flex-1">
                  <div
                    className="font-mono text-[30px] font-semibold tracking-[0.16em] text-[var(--color-ink-900)] tabular"
                  >
                    {stage.userCode}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(stage.userCode).then(() => {
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    });
                  }}
                >
                  {codeCopied ? '✓ Đã chép' : 'Chép mã'}
                </Button>
              </div>
            </div>

            <div className="rounded-[5px] border border-[var(--color-brass-500)]/30 bg-[var(--color-brass-500)]/8 px-4 py-3 text-[12px] leading-relaxed text-[var(--color-brass-700)]">
              <strong className="font-semibold">Lưu ý:</strong> Nếu bạn tải lại trang này,
              mã trên sẽ bị hủy. Hãy hoàn tất xác thực trên điện thoại trước khi reload.
            </div>
          </div>
        ) : null}

        {stage.kind === 'connected' ? (
          <StatusRow tone="success">Đã kết nối thành công. Đang chuyển hướng…</StatusRow>
        ) : null}

        {stage.kind === 'error' ? (
          <div className="space-y-4">
            <div className="rounded-[5px] border border-[var(--color-lacquer-500)]/30 bg-[var(--color-lacquer-50)] px-4 py-3 text-[13px] text-[var(--color-lacquer-700)]">
              {stage.message}
            </div>
            <Button onClick={start}>Thử lại</Button>
          </div>
        ) : null}
      </div>
    </AuthLayout>
  );
}

const STEPS = [
  'Mở liên kết bên dưới trên thiết bị có trình duyệt (điện thoại hoặc máy khác).',
  'Đăng nhập bằng tài khoản ChatGPT của bạn.',
  'Nhập mã xác thực hiển thị bên dưới và xác nhận.',
];

function StatusRow({ tone, children }: { tone: 'working' | 'success'; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[13px] text-[var(--color-ink-700)]">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          tone === 'success' ? 'bg-[var(--color-success-500)]' : 'bg-[var(--color-accent-500)] pulse-dot'
        }`}
        aria-hidden
      />
      {children}
    </div>
  );
}
