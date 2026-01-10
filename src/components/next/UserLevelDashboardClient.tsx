'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCheckInStatus, getTasks, getLeaderboard, LevelInfo, CheckInStatus, Task, LeaderboardEntry } from '@/services/leveling';
import api from '@/utils/api';
import LevelCard from '@/components/leveling/LevelCard';
import TaskBoard from '@/components/leveling/TaskBoard';
import CheckInModal from '@/components/leveling/CheckInModal';
import Leaderboard from './Leaderboard';
import Link from 'next/link';
import { Calendar, LayoutDashboard, Crown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const UserLevelDashboardClient: React.FC = () => {
  const { user } = useAuth();
  const [info, setInfo] = useState<LevelInfo | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user?.username) return;
    try {
      const [playerDetails, c, t, l] = await Promise.all([
        api.get('/api/playtime/player/details', { params: { name: user.username } }),
        getCheckInStatus(user.username),
        getTasks(user.username),
        getLeaderboard()
      ]);
      setInfo(playerDetails.data.level_info || null);
      setCheckInStatus(c);
      setTasks(t);
      setLeaderboard(l);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
        fetchData();
    } else {
        setLoading(false); // Stop loading if no user, render login prompt
    }
  }, [user]);

  if (!user) {
      return (
          <div className="min-h-screen flex items-center justify-center pt-24">
              <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
                  <Crown size={48} className="mx-auto text-yellow-500 mb-4" />
                  <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">需要登录</h2>
                  <p className="text-slate-500 mb-6">请登录以查看您的等级和任务进度。</p>
                  <Link href="/login" className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium">
                      立即登录
                  </Link>
              </div>
          </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5 }}
         className="flex flex-col md:flex-row gap-8"
      >
        {/* Left Column: Stats & Check-in */}
        <div className="w-full md:w-1/3 space-y-6">
            <LevelCard info={info} loading={loading} />
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar className="text-blue-500" />
                    签到状态
                </h3>
                
                {loading || !checkInStatus ? (
                   <div className="space-y-4 animate-pulse">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                            <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                        </div>
                        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                   </div>
                ) : (
                    <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center border border-blue-100 dark:border-blue-900/30">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">官网</div>
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {checkInStatus.web.streak} 天
                            </div>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center border border-purple-100 dark:border-purple-900/30">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">服务器</div>
                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                {checkInStatus.server.streak} 天
                            </div>
                        </div>
                    </div>

                    {/* Today's Check-in Count */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-xl text-center border border-orange-100 dark:border-orange-900/30">
                            <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-1">网页今日签到</div>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-lg font-black text-orange-600 dark:text-orange-400">
                                    {checkInStatus.today_web_checkin_count || 0}
                                </span>
                                <span className="text-xs text-orange-400 dark:text-orange-500">人</span>
                            </div>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-xl text-center border border-emerald-100 dark:border-emerald-900/30">
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">游戏今日签到</div>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                    {checkInStatus.today_server_checkin_count || 0}
                                </span>
                                <span className="text-xs text-emerald-400 dark:text-emerald-500">人</span>
                            </div>
                        </div>
                    </div>

                    {checkInStatus.today_first_checkin_user && (
                        <Link href={`/player/${checkInStatus.today_first_checkin_user.username}`} className="block mb-4 group">
                            <div className="relative overflow-hidden p-0.5 rounded-xl bg-gradient-to-r from-yellow-300 to-amber-500 shadow-md transition-transform group-hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                <div className="relative bg-white dark:bg-slate-800 rounded-[10px] p-3 flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-yellow-200 dark:border-yellow-700/50">
                                            <img 
                                                src={`https://minotar.net/helm/${checkInStatus.today_first_checkin_user.username}/100.png`}
                                                alt={checkInStatus.today_first_checkin_user.username}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute -top-2 -right-2">
                                            <Crown size={16} className="text-yellow-500 fill-yellow-500 drop-shadow-sm" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-500">今日首位签到</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-bold">
                                                Lv.{checkInStatus.today_first_checkin_user.level}
                                            </span>
                                        </div>
                                        <div className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                            {checkInStatus.today_first_checkin_user.username}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )}

                    <button
                        onClick={() => setIsCheckInOpen(true)}
                        className={checkInStatus.web.checked 
                            ? "w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            : "w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
                        }
                    >
                        {checkInStatus.web.checked ? '已签到 (查看详情)' : '立即签到'}
                    </button>
                    </>
                )}
            </div>

            <Leaderboard players={leaderboard} loading={loading} />
        </div>

        {/* Right Column: Tasks */}
        <div className="w-full md:w-2/3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-800 min-h-[500px]">
                <div className="flex items-center gap-2 mb-6">
                    <LayoutDashboard className="text-green-500" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">任务中心</h2>
                </div>
                <TaskBoard tasks={tasks} username={user.username} onTaskUpdate={fetchData} loading={loading} />
            </div>
        </div>
      </motion.div>

      <CheckInModal 
        isOpen={isCheckInOpen} 
        onClose={() => setIsCheckInOpen(false)}
        status={checkInStatus}
        username={user.username}
        onCheckInSuccess={fetchData}
      />
    </div>
  );
};

export default UserLevelDashboardClient;
