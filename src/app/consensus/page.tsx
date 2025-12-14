import { Suspense } from 'react';
import { Metadata } from 'next';
import ConsensusClient from '@/components/next/ConsensusClient';

export const metadata: Metadata = {
  title: '玩家众议 - KukeMC',
  description: '参与 KukeMC 服务器的决策，为您支持的提案投票，共同建设更好的社区。',
};

export default function ConsensusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>}>
      <ConsensusClient />
    </Suspense>
  );
}
