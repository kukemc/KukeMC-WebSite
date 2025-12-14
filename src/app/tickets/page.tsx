import { Metadata } from 'next';
import { Suspense } from 'react';
import TicketCenterClient from '@/components/next/TicketCenterClient';

export const metadata: Metadata = {
  title: '工单中心 | KukeMC',
  description: '提交问题反馈，举报违规行为，联系管理团队。',
};

export default function TicketCenterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <TicketCenterClient />
    </Suspense>
  );
}
