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

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuth((s) => s.register);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success('Tạo tài khoản thành công');
      router.push('/onboarding/connect-codex');
    } catch (err) {
      toast.error(readableError(err, 'Đăng ký thất bại'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      overline="Mở tài khoản"
      title={
        <>
          Tạo
          <br />
          <span className="italic text-[var(--color-accent-500)]">tài khoản mới.</span>
        </>
      }
      subtitle="Bước tiếp theo: kết nối tài khoản Codex của bạn để bắt đầu phiên đầu tiên."
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-medium text-[var(--color-accent-500)] underline-offset-2 hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Họ và tên"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          name="name"
          autoComplete="name"
          placeholder="Nguyễn Văn A"
        />
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
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          name="password"
          hint="Ít nhất 8 ký tự."
        />
        <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
          Tạo tài khoản
        </Button>
      </form>
    </AuthLayout>
  );
}
