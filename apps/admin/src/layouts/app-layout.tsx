import { ReactNode } from 'react';
import { Layout, Menu, Typography, Button } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ThunderboltOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-store';
import { env } from '@/config/env';

const { Sider, Header, Content } = Layout;

const items = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">Dashboard</Link> },
  { key: '/users', icon: <UserOutlined />, label: <Link to="/users">Users</Link> },
  { key: '/runs', icon: <ThunderboltOutlined />, label: <Link to="/runs">Skill runs</Link> },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={240} style={{ background: '#1a1a17' }}>
        <div
          style={{
            padding: '20px 24px',
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: '-0.01em',
          }}
        >
          {env.brandName}
        </div>
        <Menu
          mode="inline"
          theme="dark"
          items={items}
          selectedKeys={[location.pathname]}
          style={{ background: 'transparent', borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid #ececea',
          }}
        >
          <Typography.Text type="secondary">
            Signed in as <strong>{user?.email}</strong>
          </Typography.Text>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign out
          </Button>
        </Header>
        <Content style={{ padding: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
