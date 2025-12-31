import React from 'react';
import Link from 'next/link';
import { LeaderboardEntry } from '@/services/leveling';
import { getLevelColor } from '@/utils/levelUtils';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown } from 'lucide-react';

interface Props {
    players: LeaderboardEntry[] | null;
    loading?: boolean;
}

const Leaderboard: React.FC<Props> = ({ players, loading }) => {
    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown size={20} className="text-yellow-500" />;
            case 1: return <Medal size={20} className="text-gray-400" />;
            case 2: return <Medal size={20} className="text-orange-500" />;
            default: return <span className="text-sm font-bold text-gray-500 w-5 text-center">{index + 1}</span>;
        }
    };

    const getRankColor = (index: number) => {
        switch (index) {
            case 0: return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50";
            case 1: return "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50";
            case 2: return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/50";
            default: return "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50";
        }
    };

    if (loading || !players) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 animate-pulse">
                <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Trophy className="text-yellow-500" />
                等级排行榜
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-track]:bg-transparent">
                {players.map((player, index) => (
                    <Link href={`/player/${player.username}`} key={player.username} className="block group">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getRankColor(index)} group-hover:scale-[1.02] group-hover:shadow-md cursor-pointer`}
                        >
                            <div className="flex-shrink-0 w-8 flex justify-center">
                                {getRankIcon(index)}
                            </div>
                            
                            <div className="flex-shrink-0">
                                <img 
                                    src={`https://crafthead.net/helm/${player.username}/40`} 
                                    alt={player.username}
                                    className="w-10 h-10 rounded-lg shadow-sm"
                                />
                            </div>

                            <div className="flex-grow min-w-0">
                                <div className="font-bold text-gray-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {player.username}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {player.total_xp.toLocaleString()} XP
                                </div>
                            </div>

                            <div className="flex-shrink-0">
                                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border ${getLevelColor(player.level).bg} ${getLevelColor(player.level).text} ${getLevelColor(player.level).border} ${getLevelColor(player.level).shadow}`}>
                                    LV.{player.level}
                                </span>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
