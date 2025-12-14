import { Metadata } from 'next';
import SkinClient from '@/components/next/SkinClient';

export const metadata: Metadata = {
  title: '皮肤站 | KukeMC',
  description: '上传和管理您的 Minecraft 皮肤与披风。',
};

export default function SkinPage() {
  return <SkinClient />;
}
