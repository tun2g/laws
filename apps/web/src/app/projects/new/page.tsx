'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/app-shell';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { api, readableError } from '@/lib/api';
import type { Project } from '@laws/shared';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post<Project>('/projects', {
        name,
        clientName: clientName || undefined,
        description: description || undefined,
      });
      toast.success('Đã tạo dự án');
      router.push(`/projects/${data.id}` as never);
    } catch (err) {
      toast.error(readableError(err, 'Tạo dự án thất bại'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="border-b border-[var(--color-paper-200)] pb-6">
          <div className="overline">Hồ sơ mới</div>
          <h1
            className="mt-2 font-serif text-[36px] leading-[1.05] text-[var(--color-ink-900)] tracking-[-0.025em]"
            style={{ fontVariationSettings: "'SOFT' 100, 'opsz' 96, 'wght' 480" }}
          >
            Tạo dự án
          </h1>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[var(--color-ink-600)]">
            Đặt tên dự án theo vụ việc — ví dụ &ldquo;Thành lập công ty TNHH cho khách hàng A&rdquo;.
            Mọi cuộc trò chuyện và tài liệu sẽ được lưu dưới dự án này.
          </p>
        </header>

        <form onSubmit={onSubmit}>
          <Card>
            <CardHeader overline="Thông tin căn bản" title="Chi tiết dự án" />
            <CardBody className="space-y-5">
              <Input
                label="Tên dự án"
                value={name}
                onChange={(e) => setName(e.target.value)}
                name="name"
                required
                placeholder="Thành lập công ty TNHH cho khách hàng A"
              />
              <Input
                label="Tên khách hàng"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                name="clientName"
                placeholder="Công ty TNHH ABC"
                hint="Không bắt buộc."
              />
              <Textarea
                label="Mô tả ngắn"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                name="description"
                placeholder="Bối cảnh, mục tiêu, yêu cầu đặc thù…"
                hint="Sẽ hiển thị trên trang dự án."
              />
            </CardBody>
            <CardFooter>
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Hủy
              </Button>
              <Button type="submit" loading={loading}>
                Tạo dự án
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}
