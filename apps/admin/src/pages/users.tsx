import { Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { api } from '@/lib/api';
import type { User } from '@laws/shared';

interface AdminUser extends User {
  openaiKeyHint: string | null;
}

export function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => (await api.get<AdminUser[]>('/admin/users')).data,
  });

  return (
    <div>
      <h2 style={{ margin: '0 0 16px 0' }}>Users</h2>
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Email', dataIndex: 'email' },
          {
            title: 'Role',
            dataIndex: 'role',
            render: (r: string) => <Tag color={r === 'ADMIN' ? 'gold' : 'default'}>{r}</Tag>,
          },
          {
            title: 'Codex',
            dataIndex: 'openaiKeyHint',
            render: (hint: string | null) =>
              hint ? <span style={{ fontFamily: 'monospace' }}>{hint}</span> : <Tag>not connected</Tag>,
          },
          {
            title: 'Joined',
            dataIndex: 'createdAt',
            render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm'),
          },
        ]}
      />
    </div>
  );
}
