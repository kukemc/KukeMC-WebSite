import { Suspense } from 'react';
import { Metadata } from 'next';
import LoginClient from '@/components/next/LoginClient';

export const metadata: Metadata = {
  title: '玩家登录 - KukeMC',
  description: '登录 KukeMC 官网，管理您的个人资料和查看游戏数据。',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>}>
      <LoginClient />
    </Suspense>
  );
}
