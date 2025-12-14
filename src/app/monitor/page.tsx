import { Metadata } from 'next';
import MonitorClient from '@/components/next/MonitorClient';

export const metadata: Metadata = {
  title: '监控面板 | KukeMC',
  description: '实时查看 KukeMC 服务器性能与在线状态。',
};

export default function MonitorPage() {
  return <MonitorClient />;
}
