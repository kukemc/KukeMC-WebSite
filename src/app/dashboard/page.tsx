import { Metadata } from 'next';
import UserLevelDashboardClient from '@/components/next/UserLevelDashboardClient';

export const metadata: Metadata = {
  title: '任务中心 | KukeMC',
  description: '查看您的等级、完成任务、领取奖励。',
};

export default function DashboardPage() {
  return <UserLevelDashboardClient />;
}
