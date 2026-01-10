'use client';

import React, { useState, useEffect, useRef } from 'react';
import Leaderboard from './Leaderboard';
import LiveRadar from './LiveRadar';
import { WSKillEvent, WSChatEvent } from '@/types/kitbattle';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Radar, Trophy, Skull, MessageSquare, Activity, X } from 'lucide-react';

const KitBattleClient: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'stats'>('live');
  const [radarKey, setRadarKey] = useState(0);
  const [killFeed, setKillFeed] = useState<WSKillEvent[]>([]);
  const [chatLog, setChatLog] = useState<WSChatEvent[]>([]);
  const [killNotification, setKillNotification] = useState<{ killer: string, victim: string, kit: string, id: number } | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch history on mount
  useEffect(() => {
    const fetchHistory = async () => {
        try {
            const API_BASE = 'https://api.kuke.ink';
            const res = await fetch(`${API_BASE}/api/server/kitbattle/live/history`);
            if (res.ok) {
                const data = await res.json();
                if (data.chat) {
                    setChatLog(data.chat);
                }
                if (data.kills) {
                    // Sort by timestamp descending (newest first)
                    const sortedKills = data.kills.sort((a: any, b: any) => b.timestamp - a.timestamp);
                    setKillFeed(sortedKills);
                }
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        }
    };
    fetchHistory();
  }, []);

  const handleKill = (event: WSKillEvent) => {
    setKillFeed(prev => [event, ...prev].slice(0, 20));
    
    // Show overlay notification
    if (event.killer) {
        const killId = Date.now();
        setKillNotification({
            killer: event.killer.name,
            victim: event.victim.name,
            kit: event.killer.kit,
            id: killId
        });
        
        setTimeout(() => {
            setKillNotification(prev => (prev && prev.id === killId) ? null : prev);
        }, 3000);
    }
  };

  const handleChat = (event: WSChatEvent) => {
    setChatLog(prev => [...prev, event].slice(-100));
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatLog]);

  return (
    <div className="h-[calc(100vh-5rem)] w-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-400/10 dark:bg-brand-600/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-400/10 dark:bg-purple-600/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* Overlay Kill Notification */}
      <AnimatePresence>
        {killNotification && (
            <motion.div 
                key={killNotification.id}
                initial={{ y: -50, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="fixed top-24 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
            >
                <div className="glass-panel rounded-full py-2 pl-2 pr-6 shadow-lg flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                    
                    {/* Killer */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img 
                                src={`https://cravatar.eu/helmavatar/${killNotification.killer}/32.png`} 
                                className="w-8 h-8 rounded-full border border-green-500/30 shadow-sm"
                            />
                             <div className="absolute -bottom-1 -right-1 bg-green-500 text-[8px] text-white font-bold px-1 rounded-full shadow-sm flex items-center justify-center w-3 h-3">
                                <Activity size={8} />
                             </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-green-600 dark:text-green-400 text-sm leading-none">{killNotification.killer}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{killNotification.kit}</span>
                        </div>
                    </div>

                    {/* Icon */}
                    <div className="text-slate-400 dark:text-slate-600 mx-2">
                        <Swords size={16} />
                    </div>

                    {/* Victim */}
                    <div className="flex items-center gap-3 flex-row-reverse">
                        <div className="relative grayscale opacity-80">
                            <img 
                                src={`https://cravatar.eu/helmavatar/${killNotification.victim}/32.png`} 
                                className="w-8 h-8 rounded-full border border-red-500/30"
                            />
                            <div className="absolute inset-0 bg-red-500/10 rounded-full" />
                            <div className="absolute -top-2 -right-2 text-red-500">
                                <Skull size={14} />
                            </div>
                        </div>
                         <span className="font-bold text-red-500 dark:text-red-400 text-sm line-through decoration-red-500/50">{killNotification.victim}</span>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-[1800px] mx-auto px-4 py-4 flex flex-col h-full gap-4">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 glass-panel p-4 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="relative group">
                <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
                <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-brand-500/20 relative z-10 text-white">
                    <Swords size={20} />
                </div>
            </div>
            <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    职业战争
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium tracking-wider uppercase">
                    游戏数据中心
                </p>
            </div>
          </div>

          {/* Navigation Pills */}
          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50">
            {[
                { id: 'live', label: '实时雷达', icon: Radar },
                { id: 'stats', label: '排行榜', icon: Trophy }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => {
                        setActiveTab(tab.id as any);
                        if (tab.id === 'live') {
                            setRadarKey(prev => prev + 1);
                        }
                    }}
                    className={`relative px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 outline-none select-none ${
                        activeTab === tab.id 
                            ? 'text-brand-600 dark:text-white shadow-sm bg-white dark:bg-slate-700' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/30'
                    }`}
                >
                    {activeTab === tab.id && (
                        <motion.div 
                            layoutId="nav-pill"
                            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg -z-10 shadow-sm"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <motion.span 
                        className={activeTab === tab.id ? 'text-brand-500 dark:text-brand-400' : 'opacity-70'}
                        animate={{ scale: activeTab === tab.id ? 1.1 : 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <tab.icon size={16} />
                    </motion.span>
                    <motion.span
                        animate={{ scale: activeTab === tab.id ? 1.05 : 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        {tab.label}
                    </motion.span>
                </button>
            ))}
          </div>
        </header>

        {/* Main Grid Content - Flex Grow to fill screen */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
            
            {/* Left Column (Main View) */}
            <div className="lg:col-span-8 xl:col-span-9 flex flex-col h-full min-h-0 relative">
                <div className="flex-1 h-full relative flex flex-col">
                    {activeTab === 'live' ? (
                        <motion.div 
                            key={`live-${radarKey}`}
                            initial={{ opacity: 0, scale: 0.95, y: 10, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ 
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                                mass: 0.8
                            }}
                            className="flex-1 h-full glass-panel rounded-2xl overflow-hidden relative group flex flex-col shadow-2xl dark:shadow-none"
                        >
                            <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-full pl-1 pr-3 py-1 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="relative">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute inset-0" />
                                    <div className="w-2 h-2 bg-green-500 rounded-full relative" />
                                </div>
                                <span className="text-[10px] text-slate-600 dark:text-slate-300 tracking-widest font-bold">实时战况</span>
                            </div>

                            <div className="flex-1 relative z-0">
                                <LiveRadar onKillFeed={handleKill} onChat={handleChat} />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            transition={{ 
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                                mass: 0.8
                            }}
                            className="flex-1 overflow-y-auto px-4 py-2 no-scrollbar"
                        >
                            <Leaderboard />
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Right Column (HUD) */}
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4 min-h-0">
                
                {/* 2. Kill Feed (Flexible Height) */}
                <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col min-h-[200px]">
                    <div className="p-3 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 font-sans">
                            <span className="w-1 h-3 bg-red-500 rounded-sm" />
                            击杀日志
                        </span>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                            <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                            <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar relative">
                        <AnimatePresence initial={false}>
                            {killFeed.map((kill) => (
                                <motion.div 
                                    key={`${kill.timestamp}-${kill.victim.name}`}
                                    initial={{ opacity: 0, x: 20, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all group shadow-sm hover:shadow-md"
                                >
                                    {/* Killer Avatar (Left) */}
                                    {kill.killer ? (
                                        <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-300">
                                            <img 
                                                src={`https://cravatar.eu/helmavatar/${kill.killer.name}/32.png`}
                                                className="w-8 h-8 rounded-lg shadow-sm border border-green-500/20"
                                                alt={kill.killer.name}
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 text-[8px] text-white font-bold px-1 rounded-full shadow-sm flex items-center justify-center min-w-[12px] h-3 border border-white dark:border-slate-800 z-10">
                                                <Swords size={8} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                                            <Skull size={14} className="text-slate-400" />
                                        </div>
                                    )}
                                    
                                    {/* Center Info */}
                                    <div className="flex-1 flex flex-col justify-center min-w-0 px-0.5">
                                        <div className="flex items-center gap-1.5 text-xs truncate w-full">
                                            {kill.killer ? (
                                                <div className="flex items-center gap-1 w-full overflow-hidden">
                                                    <span className="text-green-600 dark:text-green-400 font-bold truncate shrink">{kill.killer.name}</span>
                                                    <span className="text-slate-300 dark:text-slate-600 shrink-0 text-[10px]">vs</span>
                                                    <span className="text-red-500 dark:text-red-400 font-medium truncate shrink">{kill.victim.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 dark:text-slate-400 font-medium truncate italic">{kill.victim.name} died</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                             <span className="text-[9px] text-slate-400 font-mono tracking-tight opacity-70">
                                                {new Date(kill.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                                            </span>
                                            {kill.killer?.kit && (
                                                <span className="text-[9px] px-1.5 py-px rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 truncate max-w-[80px]">
                                                    {kill.killer.kit}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Victim Avatar (Right) */}
                                    <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-300">
                                        <img 
                                            src={`https://cravatar.eu/helmavatar/${kill.victim.name}/32.png`}
                                            className="w-8 h-8 rounded-lg shadow-sm border border-red-500/20 grayscale-[0.3]"
                                            alt={kill.victim.name}
                                        />
                                         <div className="absolute inset-0 bg-red-500/10 rounded-lg mix-blend-overlay" />
                                         <div className="absolute -top-1.5 -right-1.5 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm border border-slate-100 dark:border-slate-800 z-10">
                                             <Skull size={10} className="text-red-500" />
                                         </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {killFeed.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                                    <Swords size={20} className="opacity-50" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-sans">暂无击杀记录</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Chat (Fixed Height) */}
                <div className="h-[250px] glass-panel rounded-2xl overflow-hidden flex flex-col shrink-0">
                    <div className="p-3 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-brand-500 dark:text-brand-400 uppercase tracking-widest flex items-center gap-2 font-sans">
                             <span className="w-1 h-3 bg-brand-500 rounded-sm" />
                            聊天频道
                        </span>
                         <span className="text-[8px] bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 px-1.5 py-0.5 rounded border border-brand-200 dark:border-brand-500/20 font-sans">实时</span>
                    </div>
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3 text-xs custom-scrollbar bg-slate-50/50 dark:bg-black/20 font-sans">
                        {chatLog.map((msg, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-2.5 group"
                            >
                                <div className="relative shrink-0 mt-0.5">
                                    <img 
                                        src={`https://cravatar.eu/helmavatar/${msg.player}/24.png`}
                                        className="w-6 h-6 rounded-md shadow-sm border border-slate-200 dark:border-slate-700/50"
                                        alt={msg.player}
                                        loading="lazy"
                                    />
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-900" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs hover:text-brand-500 dark:hover:text-brand-400 transition-colors cursor-pointer">
                                            {msg.player}
                                        </span>
                                        <span className="text-slate-400 text-[10px] font-medium opacity-50 select-none">:</span>
                                        <span className="text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                                            {msg.message}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default KitBattleClient;

