'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { NewChatModal } from '@/components/new-chat-modal';
import { FilesTab } from '@/components/files/files-tab';
import { ChatSessionsSection } from '@/components/projects/chat-sessions-section';
import { api } from '@/lib/api';
import { listChatSessions } from '@/lib/chat';
import { cn } from '@/lib/cn';
import type { Project, SkillRun } from '@laws/shared';

type Tab = 'chats' | 'files';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [showNewChat, setShowNewChat] = useState(false);
  const [showLegacy, setShowLegacy] = useState(false);
  const [tab, setTab] = useState<Tab>('chats');

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: async () => (await api.get<Project & { skillRuns: SkillRun[] }>(`/projects/${id}`)).data,
    enabled: Boolean(id),
  });

  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions', id],
    queryFn: () => listChatSessions(id),
    enabled: Boolean(id),
  });

  const legacyRuns = projectQuery.data?.skillRuns ?? [];
  const sessions = sessionsQuery.data ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-10">
        {projectQuery.isLoading ? (
          <div className="flex items-center gap-2 text-[13px] text-[var(--color-ink-500)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-500)] pulse-dot" />
            Đang tải…
          </div>
        ) : !projectQuery.data ? (
          <p className="text-[13px] text-[var(--color-ink-500)]">Không tìm thấy dự án.</p>
        ) : (
          <>
            <header className="grid grid-cols-12 gap-6 border-b border-[var(--color-paper-200)] pb-7">
              <div className="col-span-12 md:col-span-9">
                <div className="flex items-center gap-3">
                  <Link
                    href="/projects"
                    className="overline hover:!text-[var(--color-accent-500)] transition-colors"
                  >
                    ← Hồ sơ vụ việc
                  </Link>
                  {projectQuery.data.clientName ? (
                    <>
                      <span aria-hidden className="h-px w-6 bg-[var(--color-paper-300)]" />
                      <span className="overline">{projectQuery.data.clientName}</span>
                    </>
                  ) : null}
                </div>
                <h1
                  className="mt-3 font-serif text-[40px] leading-[1.05] text-[var(--color-ink-900)] tracking-[-0.025em]"
                  style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 144, 'wght' 480" }}
                >
                  {projectQuery.data.name}
                </h1>
                {projectQuery.data.description ? (
                  <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--color-ink-600)]">
                    {projectQuery.data.description}
                  </p>
                ) : null}
              </div>
              <div className="col-span-12 md:col-span-3 flex md:justify-end">
                {tab === 'chats' ? (
                  <Button onClick={() => setShowNewChat(true)}>+ Cuộc trò chuyện mới</Button>
                ) : null}
              </div>
            </header>

            <nav className="flex items-center gap-1 border-b border-[var(--color-paper-200)]">
              <TabButton active={tab === 'chats'} onClick={() => setTab('chats')}>
                Cuộc trò chuyện
              </TabButton>
              <TabButton active={tab === 'files'} onClick={() => setTab('files')}>
                Tài liệu
              </TabButton>
            </nav>

            {tab === 'files' ? (
              <FilesTab projectId={id} />
            ) : (
              <ChatSessionsSection
                projectId={id}
                sessions={sessions}
                sessionsLoading={sessionsQuery.isLoading}
                legacyRuns={legacyRuns}
                showLegacy={showLegacy}
                onToggleLegacy={() => setShowLegacy((v) => !v)}
                onCreate={() => setShowNewChat(true)}
              />
            )}
          </>
        )}
      </div>

      <NewChatModal projectId={id} open={showNewChat} onClose={() => setShowNewChat(false)} />
    </AppShell>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative px-4 py-2.5 text-[13.5px] font-medium transition-colors',
        active
          ? 'text-[var(--color-ink-900)]'
          : 'text-[var(--color-ink-500)] hover:text-[var(--color-ink-800)]',
      )}
    >
      {children}
      {active ? (
        <span
          aria-hidden
          className="absolute -bottom-px left-3 right-3 h-[2px] rounded-full bg-[var(--color-accent-500)]"
        />
      ) : null}
    </button>
  );
}
