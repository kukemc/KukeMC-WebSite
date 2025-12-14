import { Metadata } from 'next';
import SettingsClient from '@/components/next/SettingsClient';

export const metadata: Metadata = {
  title: '个人设置 | KukeMC',
  description: '管理您的个人资料和账号安全设置。',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
