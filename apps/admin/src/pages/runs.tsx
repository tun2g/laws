import { Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { api } from '@/lib/api';
import type { SkillRun, Project } from '@laws/shared';

interface AdminRun extends SkillRun {
  project: Project;
}

const STATUS_COLOR: Record<string, string> = {
  QUEUED: 'default',
  RUNNING: 'gold',
  DONE: 'green',
  FAILED: 'red',
  CANCELLED: 'default',
};

export function RunsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'runs'],
    queryFn: async () => (await api.get<AdminRun[]>('/admin/runs')).data,
  });

  return (
    <div>
      <h2 style={{ margin: '0 0 16px 0' }}>Skill runs</h2>
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        pagination={{ pageSize: 20 }}
        columns={[
          {
            title: 'Created',
            dataIndex: 'createdAt',
            render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm'),
            width: 160,
          },
          { title: 'Kind', dataIndex: 'kind', width: 110 },
          {
            title: 'Status',
            dataIndex: 'status',
            width: 120,
            render: (s: string) => <Tag color={STATUS_COLOR[s] ?? 'default'}>{s}</Tag>,
          },
          {
            title: 'Project',
            dataIndex: 'project',
            render: (p: Project) => p?.name ?? '—',
          },
          {
            title: 'Tokens',
            dataIndex: 'tokenUsage',
            width: 100,
            render: (n: number | null) => (n ?? '—'),
          },
          { title: 'Model', dataIndex: 'model', width: 120 },
        ]}
      />
    </div>
  );
}
