import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, Skull, Trophy, Coins, Zap, Target, Calendar, BarChart3, TrendingUp, Medal } from 'lucide-react';
import { KitBattleStats } from '@/types/kitbattle';
import { MinecraftText } from '@/components/MinecraftText';
import ModalPortal from '@/components/ModalPortal';
import clsx from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: KitBattleStats;
}

type Period = 'total' | 'weekly' | 'monthly';

const PERIOD_LABELS: Record<Period, string> = {
  total: '总览',
  weekly: '本周',
  monthly: '本月'
};

export default function KitBattleDetailsModal({ isOpen, onClose, stats }: Props) {
  const [activeTab, setActiveTab] = useState<Period>('total');

  // Helper to calculate period stats
  const getStat = (key: 'kills' | 'deaths' | 'exp' | 'coins') => {
    if (activeTab === 'total') return stats[key];

    const periods = stats.periods;
    if (!periods) return 0;

    if (activeTab === 'weekly') {
      if (stats.current_week_id && periods.last_weekly_id !== stats.current_week_id) return 0;
      const startVal = periods[`weekly_${key}_start` as keyof typeof periods] as number;
      return Math.max(0, stats[key] - startVal);
    }

    if (activeTab === 'monthly') {
      if (stats.current_month_id && periods.last_monthly_id !== stats.current_month_id) return 0;
      const startVal = periods[`monthly_${key}_start` as keyof typeof periods] as number;
      return Math.max(0, stats[key] - startVal);
    }

    return 0;
  };

  const kills = getStat('kills');
  const deaths = getStat('deaths');
  const exp = getStat('exp');
  const coins = getStat('coins');
  const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills;

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { scale: 0.95, opacity: 0, y: 20 },
    visible: { scale: 1, opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } },
    exit: { scale: 0.95, opacity: 0, y: 20 }
  };

  return (
    <ModalPortal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-4xl bg-white dark:bg-[#121214] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="relative p-6 pb-0 z-10">
              <div className="absolute top-0 right-0 p-4">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20">
                  <Swords className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">职业战争数据详情</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">玩家:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.name}</span>
                    <span className="mx-1 text-gray-300 dark:text-gray-700">•</span>
                    <div className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/5">
                      <MinecraftText text={stats.rank || '暂无段位'} className="text-xs font-bold" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5">
                {(['total', 'weekly', 'monthly'] as Period[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={clsx(
                      "px-4 py-3 text-sm font-medium border-b-2 transition-colors relative",
                      activeTab === tab
                        ? "border-red-500 text-red-600 dark:text-red-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                  >
                    {PERIOD_LABELS[tab]}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard 
                  label="击杀数" 
                  value={kills} 
                  icon={Target} 
                  color="text-red-500" 
                  bgColor="bg-red-500/10" 
                />
                <StatCard 
                  label="死亡数" 
                  value={deaths} 
                  icon={Skull} 
                  color="text-gray-500" 
                  bgColor="bg-gray-500/10" 
                />
                <StatCard 
                  label="K/D 比率" 
                  value={kd} 
                  icon={Zap} 
                  color="text-yellow-500" 
                  bgColor="bg-yellow-500/10" 
                />
                <StatCard 
                  label="持有职业币" 
                  value={coins.toLocaleString()} 
                  icon={Coins} 
                  color="text-amber-500" 
                  bgColor="bg-amber-500/10" 
                />
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                 <div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">经验值</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{exp.toLocaleString()}</p>
                      </div>
                    </div>
                 </div>
                 <div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">最爱职业</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{stats.favorite_kit || '暂无'}</p>
                      </div>
                    </div>
                 </div>
              </div>

              {/* Kits Breakdown */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                  职业表现
                </h3>
                
                {stats.kits_stats && stats.kits_stats.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stats.kits_stats.map((kit, index) => (
                      <div 
                        key={kit.kit_name}
                        className="p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-red-500/30 transition-colors flex items-center justify-between group"
                      >
                         <div className="flex items-center gap-3">
                           <div className={clsx(
                             "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                             index < 3 ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" : "bg-gray-100 dark:bg-white/10 text-gray-500"
                           )}>
                             #{index + 1}
                           </div>
                           <span className="font-semibold text-gray-800 dark:text-gray-200">{kit.kit_name}</span>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{kit.kills}</span>
                            <span className="text-[10px] text-gray-500 uppercase">击杀数</span>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10">
                    <p className="text-gray-500">暂无职业使用数据</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}

const StatCard = ({ label, value, icon: Icon, color, bgColor }: any) => (
  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none">
    <div className={clsx("p-3 rounded-xl mb-3", bgColor, color)}>
      <Icon className="w-5 h-5" />
    </div>
    <span className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{value}</span>
    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
  </div>
);
