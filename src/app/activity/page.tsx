import { Suspense } from 'react';
import { Metadata } from 'next';
import ActivityClient from '@/components/next/ActivityClient';

export const metadata: Metadata = {
  title: '动态广场 - KukeMC',
  description: 'KukeMC 玩家动态广场，分享你的游戏瞬间，参与热门话题讨论。',
};

export default function ActivityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>}>
      <ActivityClient />
    </Suspense>
  );
}
