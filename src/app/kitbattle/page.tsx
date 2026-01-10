import { Metadata } from 'next';
import KitBattleClient from '@/components/next/kitbattle/KitBattleClient';

export const metadata: Metadata = {
  title: '职业战争 - KukeMC',
  description: '查看职业战争(KitBattle)的实时战况、排行榜和玩家数据。',
};

export default function KitBattlePage() {
  return <KitBattleClient />;
}
