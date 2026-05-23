import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { env } from '@/config/env';

export const metadata: Metadata = {
  title: `${env.brandName} — Trợ lý AI cho luật sư Việt Nam`,
  description:
    'Nền tảng tra cứu thủ tục pháp lý, rà soát dự thảo và dịch tài liệu Việt–Anh dành cho luật sư Việt Nam, sử dụng tài khoản Codex của bạn.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body
        style={{
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
