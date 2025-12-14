import { Suspense } from 'react';
import { Metadata } from 'next';
import PlayersClient from '@/components/next/PlayersClient';

export const metadata: Metadata = {
  title: '在线玩家 - KukeMC',
  description: '查看 KukeMC 服务器实时在线玩家列表，了解服务器火爆程度。',
};

export default function PlayersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>}>
      <PlayersClient />
    </Suspense>
  );
}
