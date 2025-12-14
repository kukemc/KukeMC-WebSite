import { Metadata } from 'next';
import ThanksClient from '@/components/next/ThanksClient';

export const metadata: Metadata = {
  title: '鸣谢 | KukeMC',
  description: '感谢所有为 KukeMC 做出贡献的开发者和玩家。',
};

export default function ThanksPage() {
  return <ThanksClient />;
}
