'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useAuth } from '@/lib/auth-store';
import { readableError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Xin chào, ${user.name}`);
      router.push(user.codexConnected ? '/dashboard' : '/onboarding/connect-codex');
    } catch (err) {
      toast.error(readableError(err, 'Đăng nhập thất bại'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      overline="Đăng nhập"
      title={
        <>
          Tiếp tục
          <br />
          <span className="italic text-[var(--color-accent-500)]">phiên làm việc.</span>
        </>
      }
      subtitle="Đăng nhập để mở lại các dự án và phiên Codex đang dang dở."
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link href="/register" className="font-medium text-[var(--color-accent-500)] underline-offset-2 hover:underline">
            Tạo mới
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          name="email"
          placeholder="ten.luatsu@vanphongluat.vn"
        />
        <Input
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          name="password"
          placeholder="••••••••"
        />
        <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
          Đăng nhập
        </Button>
      </form>
    </AuthLayout>
  );
}
