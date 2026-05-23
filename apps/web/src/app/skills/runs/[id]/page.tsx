'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { SkillRunView } from '@/components/skill-run-view';

export default function RunDetailPage() {
  return (
    <Suspense fallback={<RunDetailFallback />}>
      <RunDetailPageContent />
    </Suspense>
  );
}

function RunDetailPageContent() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const autoStart = sp.get('autostart') === '1';

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <SkillRunView runId={id} autoStart={autoStart} />
      </div>
    </AppShell>
  );
}

function RunDetailFallback() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <div className="paper-card px-6 py-8">
          <div className="h-6 w-48 rounded bg-[var(--color-paper-100)] shimmer" />
          <div className="mt-4 h-24 rounded bg-[var(--color-paper-100)] shimmer" />
        </div>
      </div>
    </AppShell>
  );
}
