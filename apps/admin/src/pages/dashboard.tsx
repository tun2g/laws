import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Statistic } from 'antd';
import { api } from '@/lib/api';

interface Stats {
  userCount: number;
  projectCount: number;
  runCount: number;
  runningRunCount: number;
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => (await api.get<Stats>('/admin/stats')).data,
  });

  return (
    <div>
      <h2 style={{ margin: '0 0 16px 0' }}>Overview</h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="Users" value={data?.userCount ?? 0} loading={isLoading} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Projects" value={data?.projectCount ?? 0} loading={isLoading} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Skill runs" value={data?.runCount ?? 0} loading={isLoading} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Running now"
              value={data?.runningRunCount ?? 0}
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
