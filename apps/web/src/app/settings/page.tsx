'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { CodexStatusSummary, CodexUsageSummary } from '@laws/shared';
import { AppShell } from '@/components/app-shell';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, readableError } from '@/lib/api';
import { disconnectCodex, getCodexStatus } from '@/lib/codex';
import { useAuth } from '@/lib/auth-store';

export default function SettingsPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [codexStatus, setCodexStatus] = useState<CodexStatusSummary | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [usage, setUsage] = useState<CodexUsageSummary | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadStatus() {
      setLoadingStatus(true);
      try {
        const data = await getCodexStatus();
        if (alive) setCodexStatus(data);
      } catch {
        if (alive) setCodexStatus(null);
      } finally {
        if (alive) setLoadingStatus(false);
      }
    }

    async function loadUsage() {
      setLoadingUsage(true);
      try {
        const { data } = await api.get<CodexUsageSummary>('/users/me/codex-usage');
        if (alive) setUsage(data);
      } catch {
        if (alive) setUsage(null);
      } finally {
        if (alive) setLoadingUsage(false);
      }
    }

    void loadStatus();
    void loadUsage();
    return () => {
      alive = false;
    };
  }, []);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    try {
      await api.patch('/users/me', { name });
      await refresh();
      toast.success('Đã cập nhật hồ sơ');
    } catch (err) {
      toast.error(readableError(err));
    } finally {
      setSavingName(false);
    }
  }

  async function disconnect() {
    if (!confirm('Ngắt kết nối Codex sẽ xóa phiên đăng nhập ChatGPT của bạn khỏi máy chủ. Tiếp tục?')) return;
    setDisconnecting(true);
    try {
      await disconnectCodex();
      await refresh();
      setCodexStatus((current) =>
        current
          ? {
              ...current,
              connected: false,
              connectedAt: null,
              activeRuns: 0,
            }
          : current,
      );
      setUsage((current) =>
        current
          ? {
              ...current,
              connected: false,
            }
          : current,
      );
      toast.success('Đã ngắt kết nối Codex');
    } catch (err) {
      toast.error(readableError(err));
    } finally {
      setDisconnecting(false);
    }
  }

  if (!user) return null;

  const connectedAtLabel = user.codexConnectedAt
    ? new Date(user.codexConnectedAt).toLocaleString('vi-VN')
    : null;
  const statusConnectedAtLabel = codexStatus?.connectedAt
    ? new Date(codexStatus.connectedAt).toLocaleString('vi-VN')
    : null;
  const lastActivityLabel = usage?.lastActivityAt
    ? new Date(usage.lastActivityAt).toLocaleString('vi-VN')
    : null;

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_1.35fr]">
          <form onSubmit={saveName}>
            <Card className="h-full">
              <CardHeader
                overline="Identity"
                title="Hồ sơ cá nhân"
                description="Thông tin hiển thị nội bộ cho workspace của bạn."
              />
              <CardBody className="space-y-4">
                <Input label="Email" value={user.email} disabled />
                <Input
                  label="Họ và tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  name="name"
                />
              </CardBody>
              <CardFooter>
                <Button type="submit" loading={savingName}>
                  Lưu hồ sơ
                </Button>
              </CardFooter>
            </Card>
          </form>

          <Card>
            <CardHeader
              overline="Runtime"
              title="Tài khoản Codex"
              description="Phiên đăng nhập ChatGPT/Codex riêng cho bạn. Ngắt kết nối sẽ hủy phiên đăng nhập; các tài liệu đã lưu vẫn được giữ."
            />
            <CardBody className="space-y-4">
              {user.codexConnected ? (
                <div className="flex items-center justify-between rounded-[10px] border border-[var(--color-success-500)]/25 bg-[linear-gradient(180deg,rgba(44,94,58,0.08),rgba(44,94,58,0.04))] px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2 text-[13.5px] font-medium text-[var(--color-ink-900)]">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-success-500)]" />
                      Đã kết nối qua ChatGPT
                    </div>
                    {connectedAtLabel ? (
                      <div className="mt-1 text-[11.5px] tabular text-[var(--color-ink-500)]">
                        Đăng nhập lúc {connectedAtLabel}
                      </div>
                    ) : null}
                  </div>
                  <Button variant="danger" size="sm" onClick={disconnect} loading={disconnecting}>
                    Ngắt kết nối
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-[10px] border border-[var(--color-brass-500)]/30 bg-[linear-gradient(180deg,rgba(168,132,60,0.08),rgba(168,132,60,0.04))] px-5 py-4">
                  <div>
                    <div className="text-[13.5px] font-medium text-[var(--color-brass-700)]">
                      Chưa kết nối
                    </div>
                    <div className="mt-1 text-[11.5px] text-[var(--color-brass-700)]/80">
                      Bạn cần đăng nhập ChatGPT để dùng Codex.
                    </div>
                  </div>
                  <Button size="sm" onClick={() => router.push('/onboarding/connect-codex')}>
                    Kết nối ngay
                  </Button>
                </div>
              )}

              <div className="rounded-[10px] border border-[rgba(188,174,139,0.5)] bg-[rgba(241,233,215,0.5)] px-5 py-5">
                {loadingStatus ? (
                  <div className="text-[12.5px] text-[var(--color-ink-500)]">
                    Đang kiểm tra trạng thái Codex...
                  </div>
                ) : codexStatus ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <StatusItem
                      label="Trạng thái trực tiếp"
                      value={codexStatus.connected ? 'Sẵn sàng' : 'Chưa kết nối'}
                    />
                    <StatusItem
                      label="Tác vụ đang chạy"
                      value={`${codexStatus.activeRuns}/${codexStatus.maxConcurrentPerUser}`}
                    />
                    <StatusItem label="Sandbox" value={codexStatus.sandboxMode} />
                    <StatusItem
                      label="Đăng nhập gần nhất"
                      value={statusConnectedAtLabel ?? connectedAtLabel ?? 'Chưa có'}
                    />
                  </div>
                ) : (
                  <div className="text-[12.5px] text-[var(--color-lacquer-700)]">
                    Không lấy được trạng thái trực tiếp từ Codex.
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            overline="Usage"
            title="Mức sử dụng Codex"
            description="Số liệu token và lượt chạy được ghi nhận bên trong hệ thống này, không phải số billing trực tiếp từ OpenAI."
          />
          <CardBody className="space-y-5">
            {loadingUsage ? (
              <div className="rounded-[6px] border border-[var(--color-paper-200)] bg-[var(--color-paper-50)] px-5 py-4 text-[13px] text-[var(--color-ink-500)]">
                Đang tải số liệu sử dụng...
              </div>
            ) : usage ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <UsageStat
                    label="Tổng token"
                    value={formatNumber(usage.totals.tokens)}
                    hint="Bao gồm skill runs và chat assistant"
                  />
                  <UsageStat
                    label="Lượt chạy skill"
                    value={formatNumber(usage.totals.skillRuns)}
                    hint="Chỉ tính các lượt đã có token usage"
                  />
                  <UsageStat
                    label="Tin nhắn chat"
                    value={formatNumber(usage.totals.chatMessages)}
                    hint="Chỉ tính phản hồi assistant"
                  />
                </div>

                <div className="rounded-[10px] border border-[rgba(188,174,139,0.5)] bg-[rgba(241,233,215,0.5)] px-5 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--color-ink-500)]">
                        30 ngày gần đây
                      </div>
                      <div className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-[var(--color-ink-900)]">
                        {formatNumber(usage.last30Days.tokens)} tokens
                      </div>
                    </div>
                    <div className="text-right text-[12.5px] text-[var(--color-ink-600)]">
                      <div>{formatNumber(usage.last30Days.skillRuns)} skill runs</div>
                      <div>{formatNumber(usage.last30Days.chatMessages)} chat messages</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[10px] border border-[rgba(188,174,139,0.42)] bg-[rgba(255,253,248,0.55)] px-5 py-4 text-[12.5px] text-[var(--color-ink-600)]">
                  <div>
                    Hoạt động gần nhất:{' '}
                    <span className="font-medium text-[var(--color-ink-900)]">
                      {lastActivityLabel ?? 'Chưa có'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[6px] border border-[var(--color-lacquer-500)]/20 bg-[var(--color-lacquer-500)]/6 px-5 py-4 text-[13px] text-[var(--color-lacquer-700)]">
                Không tải được số liệu sử dụng Codex.
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

function UsageStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[10px] border border-[rgba(188,174,139,0.5)] bg-[rgba(255,253,248,0.66)] px-4 py-4">
      <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--color-ink-500)]">
        {label}
      </div>
      <div className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[var(--color-ink-900)]">
        {value}
      </div>
      <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--color-ink-500)]">{hint}</div>
    </div>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-[var(--color-ink-500)]">
        {label}
      </div>
      <div className="mt-1 text-[15px] font-medium text-[var(--color-ink-900)]">{value}</div>
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}
