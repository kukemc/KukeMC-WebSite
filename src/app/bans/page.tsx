import { Suspense } from 'react';
import { Metadata } from 'next';
import BanListClient from '@/components/next/BanListClient';

export const metadata: Metadata = {
  title: '封禁列表 - KukeMC',
  description: '查看 KukeMC 服务器违规玩家公示及封禁记录。',
};

export default function BansPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>}>
      <BanListClient />
    </Suspense>
  );
}
