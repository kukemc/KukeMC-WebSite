import { Metadata } from 'next';
import ProfileClient from '@/components/next/profile/ProfileClient';

export const revalidate = 60; // Revalidate every minute

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = params.username;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'https://api.kuke.ink';
    const res = await fetch(`${baseUrl}/api/profile/${username}`);
    
    if (!res.ok) {
      return {
        title: `${username} - 玩家不存在`,
        description: '该玩家不存在或从未进入过服务器。',
      };
    }

    const profile = await res.json();
    const bio = profile.bio || profile.signature || `${username} 在 KukeMC 的个人主页，查看他们的游戏统计、动态和相册。`;

    return {
      title: `${username} 的个人主页 | KukeMC`,
      description: bio,
      openGraph: {
        title: `${username} 的个人主页 | KukeMC`,
        description: bio,
        images: [`https://crafthead.net/helm/${username}/256`],
      },
    };
  } catch (e) {
    return {
      title: `${username} 的个人主页 | KukeMC`,
      description: `查看 ${username} 的游戏统计、动态和相册。`,
    };
  }
}

export default function PlayerProfilePage() {
  return <ProfileClient />;
}
