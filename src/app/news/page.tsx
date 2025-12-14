import { Suspense } from 'react';
import { Metadata } from 'next';
import NewsClient from '@/components/next/NewsClient';

export const metadata: Metadata = {
  title: '资讯中心 - KukeMC',
  description: '了解服务器最新动态、活动信息与开发进程',
};

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>}>
      <NewsClient initialTab="news" />
    </Suspense>
  );
}
