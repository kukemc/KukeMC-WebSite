import React, { useRef, useState, useEffect } from 'react';
import { Swords, Skull, Trophy, Coins, Zap, Activity, BedDouble, TrendingUp, Target, Crown, Clock, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import { KitBattleStats } from '@/types/kitbattle';
import clsx from 'clsx';
import { MinecraftText } from '@/components/MinecraftText';
import KitBattleDetailsModal from './KitBattleDetailsModal';

interface Props {
  kitBattleStats: KitBattleStats | null;
}

// 辅助函数：将文本颜色转换为带透明度的背景色
const getBgColorClass = (textColorClass: string) => {
  return textColorClass
    .replace(/text-/g, 'bg-')
    .split(' ')
    .map(cls => cls + '/10')
    .join(' ');
};

// 紧凑型数据项
const CompactStatItem = ({ label, value, color, icon: Icon }: { label: string, value: string | number, color: string, icon: any }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 transition-colors hover:bg-gray-100 dark:hover:bg-white/10 group/item">
    <div className={clsx("p-2 rounded-lg transition-transform group-hover/item:scale-110", getBgColorClass(color))}>
      <Icon className={clsx("w-4 h-4", color)} />
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-500 font-semibold">{label}</span>
      <span className="text-base font-bold text-gray-900 dark:text-white leading-none mt-1 font-mono">{value}</span>
    </div>
  </div>
);

// 紧凑型游戏卡片
const CompactKitBattleCard = ({ stats, onClick }: { stats: KitBattleStats, onClick: () => void }) => {
  const kdRatio = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills;

  return (
    <div 
      onClick={onClick}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-gray-50 dark:bg-[#0f0f11] border border-gray-200 dark:border-white/5 hover:border-red-500/30 dark:hover:border-red-500/30 transition-all cursor-pointer group shadow-sm dark:shadow-none hover:shadow-xl hover:-translate-y-1 flex flex-col"
    >
      {/* 动态背景 */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
         <div className="absolute -right-20 -top-20 w-60 h-60 bg-red-600/10 rounded-full blur-[80px]" />
         <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-orange-600/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 p-5 flex flex-col h-full">
        {/* 头部信息 */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20 border border-red-500/20 group-hover:scale-105 transition-transform shadow-inner">
               <Swords className="w-6 h-6 text-red-500 dark:text-red-400" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">职业战争</h3>
               <p className="text-xs text-red-500/80 dark:text-red-400/80 font-medium">KitBattle Season 1</p>
             </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 backdrop-blur-sm shadow-sm">
             <MinecraftText text={stats.rank || '无段位'} className="text-xs font-bold" />
          </div>
        </div>

        {/* 核心数据网格 */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <CompactStatItem icon={Target} label="击杀" value={stats.kills} color="text-red-500 dark:text-red-400" />
          <CompactStatItem icon={Skull} label="死亡" value={stats.deaths} color="text-gray-500 dark:text-gray-400" />
          <CompactStatItem icon={Zap} label="K/D" value={kdRatio} color="text-yellow-500 dark:text-yellow-400" />
          <CompactStatItem icon={Coins} label="职业币" value={stats.coins.toLocaleString()} color="text-amber-500 dark:text-amber-400" />
        </div>

        {/* 底部信息 */}
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/5 flex items-center justify-between text-xs text-gray-500">
           <div className="flex items-center gap-2">
             <Trophy className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
             <span className="text-gray-400">最爱职业:</span>
             <span className="text-gray-700 dark:text-white font-semibold">{stats.favorite_kit || '无'}</span>
           </div>
           <div className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
             <span>查看详情</span>
             <ChevronRight className="w-3.5 h-3.5" />
           </div>
        </div>
      </div>
    </div>
  );
};

const CompactComingSoonCard = ({ title, icon: Icon, color }: { title: string, icon: any, color: string }) => (
  <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gray-50 dark:bg-[#0f0f11] border border-gray-200 dark:border-white/5 p-5 flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-all grayscale hover:grayscale-0 shadow-sm dark:shadow-none hover:shadow-lg group">
     <div className={clsx("p-4 rounded-2xl mb-3 transition-transform group-hover:scale-110 duration-500", getBgColorClass(color))}>
        <Icon className={clsx("w-8 h-8", color)} />
     </div>
     <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
     <p className="text-xs text-gray-500 mb-5 max-w-[200px]">更多游戏数据正在接入中，敬请期待...</p>
     <div className="px-3 py-1 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-[10px] text-gray-400 font-bold uppercase tracking-widest group-hover:bg-white/10 group-hover:text-gray-300 transition-colors">
        Coming Soon
     </div>
  </div>
);

export default function GameStatsCard({ kitBattleStats }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 模拟数据用于测试轮播效果（实际使用时只渲染真实数据）
  const cards = [
    kitBattleStats ? (
      <CompactKitBattleCard 
        key="kitbattle" 
        stats={kitBattleStats} 
        onClick={() => setIsModalOpen(true)}
      />
    ) : null,
    <CompactComingSoonCard key="bedwars" title="起床战争" icon={BedDouble} color="text-blue-500 dark:text-blue-400" />,
    <CompactComingSoonCard key="skywars" title="尽请期待" icon={Swords} color="text-sky-400" />,
    // 添加更多卡片以测试分页
    // <CompactComingSoonCard key="tntrun" title="TNT跑酷" icon={TrendingUp} color="text-red-400" />,
  ].filter(Boolean);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
      
      // 更新当前页码
      const newPageIndex = Math.round(scrollLeft / clientWidth);
      setPageIndex(newPageIndex);
    }
  };

  // 初始化和监听窗口大小变化来计算总页数
  useEffect(() => {
    const updateLayout = () => {
      if (scrollContainerRef.current) {
        const { clientWidth, scrollWidth } = scrollContainerRef.current;
        // 简单的页数计算：总滚动宽度 / 视口宽度
        // 注意：由于有gap，这个计算可能需要微调，但在 snap 模式下通常足够
        const pages = Math.round(scrollWidth / clientWidth);
        setTotalPages(pages > 0 ? pages : 1);
        checkScroll();
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    // 延迟再次计算以确保渲染完成
    setTimeout(updateLayout, 100);

    return () => window.removeEventListener('resize', updateLayout);
  }, [cards.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -clientWidth : clientWidth,
        behavior: 'smooth'
      });
    }
  };

  const scrollToPage = (index: number) => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        left: index * clientWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <div className="relative group/container bg-white dark:bg-[#151517] rounded-3xl border border-gray-200 dark:border-white/5 p-1.5 md:p-2">
        {/* 滚动按钮 - 仅在需要时显示 */}
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md border border-gray-200 dark:border-white/10 shadow-lg text-gray-700 dark:text-white opacity-0 group-hover/container:opacity-100 transition-all hover:scale-110"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md border border-gray-200 dark:border-white/10 shadow-lg text-gray-700 dark:text-white opacity-0 group-hover/container:opacity-100 transition-all hover:scale-110"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* 卡片容器 */}
        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto gap-3 md:gap-4 snap-x snap-mandatory scrollbar-hide px-1 py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {cards.map((card, index) => (
            <div key={index} className="flex-none w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(50%-0.5rem)] snap-start flex">
              {card}
            </div>
          ))}
        </div>
        
        {/* 分页指示器 - 悬浮在右上角 */}
        {totalPages > 1 && (
          <div className="absolute top-4 right-4 z-20 flex gap-1.5 p-1 rounded-full bg-black/20 dark:bg-white/5 backdrop-blur-md border border-white/5">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToPage(idx)}
                className={clsx(
                  "h-1 rounded-full transition-all duration-300",
                  pageIndex === idx 
                    ? "w-3 bg-white shadow-sm" 
                    : "w-1 bg-white/30 hover:bg-white/50"
                )}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 详情模态框 */}
      {kitBattleStats && (
        <KitBattleDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          stats={kitBattleStats}
        />
      )}
    </>
  );
}
