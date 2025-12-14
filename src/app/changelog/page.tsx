import { Suspense } from 'react';
import { Metadata } from 'next';
import NewsClient from '@/components/next/NewsClient';

export const metadata: Metadata = {
  title: '更新日志 - KukeMC',
  description: '查看 KukeMC 服务器更新历史和改动日志',
};

export default function ChangelogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>}>
      <NewsClient initialTab="changelog" />
    </Suspense>
  );
}
