import React from 'react';
import { LevelInfo } from '../../services/leveling';
import { Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  info: LevelInfo | null; // Allow null for loading state
  loading?: boolean;
}

const LevelCard: React.FC<Props> = ({ info, loading }) => {
  if (loading || !info) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
             <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
             <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
        <div className="space-y-2">
            <div className="flex justify-between">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.min((info.progress.current / info.progress.max) * 100, 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden"
    >
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-4">
            <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">当前等级</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                        LV.{info.level}
                    </span>
                    <span className="text-sm text-gray-400">排名 #{info.rank}</span>
                </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30 transform transition-transform hover:scale-110">
                <Trophy size={24} />
            </div>
        </div>

        <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Zap size={12} className="text-yellow-500"/>
                    {info.current_xp} XP
                </span>
                <span className="text-gray-400">下一级: {info.next_level_xp} XP</span>
            </div>
            
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-[0_0_10px_rgba(251,146,60,0.5)]"
                ></motion.div>
            </div>
            
            <p className="text-xs text-gray-400 text-right">
                距离升级还需 {(info.next_level_xp - info.current_xp)} XP
            </p>
        </div>
    </motion.div>
  );
};

export default LevelCard;
