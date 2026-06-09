import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '读书记录',
    template: '%s | 读书记录',
  },
  description: '记录你的阅读旅程，追踪读书进度，分享阅读感悟',
  keywords: [
    '读书',
    '阅读',
    '书单',
    '阅读记录',
    '读书笔记',
    '书评',
  ],
  authors: [{ name: 'Reading Tracker' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="antialiased h-full">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
