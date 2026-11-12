import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'SpaceVision — Bất động sản thương mại & Không gian kinh doanh 3D',
  description:
    'Nền tảng khảo sát và tối ưu mặt bằng kinh doanh thương mại với công nghệ Bản đồ 3D toà nhà, Digital Twin và tư vấn thiết kế tại Hà Nội.',
  keywords: [
    'SpaceVision',
    'Bất động sản thương mại Hà Nội',
    'Mặt bằng kinh doanh',
    'Bản đồ 3D toà nhà',
    'Digital Twin',
    'Khảo sát mặt bằng',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-sky-500/20 selection:text-sky-900">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
