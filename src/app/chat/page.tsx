import { Metadata } from 'next';
import LiveChatClient from '@/components/next/LiveChatClient';

export const metadata: Metadata = {
  title: '在线聊天 | KukeMC',
  description: '与服务器内的玩家实时互通聊天。',
};

export default function ChatPage() {
  return <LiveChatClient />;
}
