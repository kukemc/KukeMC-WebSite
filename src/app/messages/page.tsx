import { Metadata } from 'next';
import MessagesClient from '@/components/next/MessagesClient';

export const metadata: Metadata = {
  title: '留言板 | KukeMC',
  description: '玩家留言交流，分享游戏心得。',
};

export default function MessagesPage() {
  return <MessagesClient />;
}
