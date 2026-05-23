'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { api, readableError, isCodexNotConnectedError } from '@/lib/api';
import type { Project, SkillRun, SkillRunKind, SkillSummary } from '@laws/shared';

const PLACEHOLDERS: Record<SkillRunKind, string> = {
  research:
    'Mô tả tình huống khách hàng. VD: "Khách hàng là công dân Đài Loan, muốn thành lập công ty TNHH 1 thành viên tại TP HCM với vốn 1 tỷ đồng, ngành nghề tư vấn quản lý..."',
  review: 'Dán nội dung dự thảo tư vấn (Markdown) cần rà soát.',
  translate:
    'Dán văn bản pháp lý cần dịch (Markdown). Hệ thống sẽ tự nhận diện ngôn ngữ.',
  'dual-lang':
    'Dán bản tiếng Việt, dòng <<<EN>>> rồi dán bản tiếng Anh để ghép thành tài liệu song ngữ.',
  docx: 'Dán Markdown của bản tư vấn để chuẩn hóa cấu trúc cho xuất .docx.',
};

export default function StartSkillPage() {
  return (
    <Suspense fallback={<StartSkillFallback />}>
      <StartSkillPageContent />
    </Suspense>
  );
}

function StartSkillPageContent() {
  const { kind } = useParams<{ kind: string }>();
  const router = useRouter();
  const sp = useSearchParams();
  const initialProjectId = sp.get('projectId') ?? '';

  const skillsQuery = useQuery({
    queryKey: ['skills'],
    queryFn: async () => (await api.get<SkillSummary[]>('/skills')).data,
  });
  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get<Project[]>('/projects')).data,
  });

  const skill = (skillsQuery.data ?? []).find((s) => s.id === kind);

  const [projectId, setProjectId] = useState(initialProjectId);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId && projectsQuery.data && projectsQuery.data.length > 0) {
      setProjectId(projectsQuery.data[0]!.id);
    }
  }, [projectId, projectsQuery.data]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!skill) return;
    setLoading(true);
    try {
      const { data } = await api.post<SkillRun>('/skills/runs', {
        projectId,
        kind: skill.id,
        input,
      });
      router.push(`/skills/runs/${data.id}?autostart=1`);
    } catch (err) {
      if (isCodexNotConnectedError(err)) {
        toast.error('Bạn cần kết nối Codex trước.');
        router.push('/onboarding/connect-codex');
        return;
      }
      toast.error(readableError(err, 'Không tạo được phiên'));
    } finally {
      setLoading(false);
    }
  }

  if (!skill) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-[var(--color-ink-500)]">Skill không tồn tại.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <form onSubmit={onSubmit}>
          <Card>
            <CardHeader title={skill.labelVi} description={skill.descriptionVi} />
            <CardBody className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink-700)]">
                  Dự án
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  className="block w-full rounded-md border border-[var(--color-ink-200)] bg-white px-3 py-2 text-sm shadow-xs focus:border-[var(--color-accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-200)]"
                >
                  <option value="" disabled>
                    Chọn dự án…
                  </option>
                  {(projectsQuery.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-[var(--color-ink-500)]">
                  Chưa có dự án?{' '}
                  <a href="/projects/new" className="text-[var(--color-accent-600)] underline-offset-2 hover:underline">
                    Tạo mới
                  </a>
                </p>
              </div>

              <Textarea
                label="Nội dung đầu vào"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={PLACEHOLDERS[skill.id as SkillRunKind] ?? ''}
                required
                className="min-h-[220px] font-mono"
              />
            </CardBody>
            <CardFooter>
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Hủy
              </Button>
              <Button type="submit" loading={loading}>
                Chạy Codex
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}

function StartSkillFallback() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader title="Đang tải skill" description="Chuẩn bị biểu mẫu làm việc..." />
          <CardBody className="space-y-4">
            <div className="h-11 rounded bg-[var(--color-paper-100)] shimmer" />
            <div className="min-h-[220px] rounded bg-[var(--color-paper-100)] shimmer" />
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
