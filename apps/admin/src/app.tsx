import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth-store';
import { AppLayout } from './layouts/app-layout';
import { LoginPage } from './pages/login';
import { DashboardPage } from './pages/dashboard';
import { UsersPage } from './pages/users';
import { RunsPage } from './pages/runs';

export default function App() {
  const { user, loading, initialise } = useAuth();
  const location = useLocation();

  useEffect(() => {
    void initialise();
  }, [initialise]);

  if (loading) return null;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace state={{ from: location }} />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/runs" element={<RunsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}
