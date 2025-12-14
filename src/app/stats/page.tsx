import { Suspense } from 'react';
import { Metadata } from 'next';
import StatsClient from '@/components/next/StatsClient';

export const metadata: Metadata = {
  title: '数据统计 - KukeMC',
  description: '查看服务器玩家在线时长、活跃度排名等统计数据。',
};

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>}>
      <StatsClient />
    </Suspense>
  );
}
