'use client';

import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Flame, Coins, Star, Skull, BarChart2 } from 'lucide-react';

type LeaderboardType = 'kills' | 'deaths' | 'exp' | 'coins';
type PeriodType = 'total' | 'weekly' | 'monthly';

const minecraftColorClasses: Record<string, string> = {
  '0': 'text-black dark:text-black',
  '1': 'text-[#0000AA] dark:text-[#5555FF]',
  '2': 'text-[#00AA00] dark:text-[#55FF55]',
  '3': 'text-[#00AAAA] dark:text-[#55FFFF]',
  '4': 'text-[#AA0000] dark:text-[#FF5555]',
  '5': 'text-[#AA00AA] dark:text-[#FF55FF]',
  '6': 'text-[#D97706] dark:text-[#FFAA00]', // Gold
  '7': 'text-[#4B5563] dark:text-[#AAAAAA]', // Gray (Darker in light mode for readability)
  '8': 'text-[#555555] dark:text-[#555555]', // Dark Gray
  '9': 'text-[#2563EB] dark:text-[#5555FF]',
  'a': 'text-[#16A34A] dark:text-[#55FF55]',
  'b': 'text-[#0891B2] dark:text-[#55FFFF]',
  'c': 'text-[#DC2626] dark:text-[#FF5555]',
  'd': 'text-[#C026D3] dark:text-[#FF55FF]',
  'e': 'text-[#CA8A04] dark:text-[#FFFF55]', // Yellow
  'f': 'text-[#1F2937] dark:text-white',     // White
};

const renderMinecraftText = (text: string) => {
  if (!text) return null;
  if (!text.includes('§')) return <span>{text}</span>;

  const segments: { text: string; color: string | null; bold: boolean; italic: boolean; underline: boolean; strike: boolean; obfuscated: boolean }[] = [];
  
  let currentColor: string | null = null;
  let bold = false;
  let italic = false;
  let underline = false;
  let strike = false;
  let obfuscated = false;

  const parts = text.split(/(§[0-9a-fk-or])/g);

  parts.forEach((part) => {
    if (part.startsWith('§')) {
      const code = part[1].toLowerCase();
      if (/[0-9a-f]/.test(code)) {
        currentColor = code;
        // Color codes reset formatting
        bold = false;
        italic = false;
        underline = false;
        strike = false;
        obfuscated = false;
      } else {
        switch (code) {
          case 'l': bold = true; break;
          case 'o': italic = true; break;
          case 'n': underline = true; break;
          case 'm': strike = true; break;
          case 'k': obfuscated = true; break;
          case 'r':
            currentColor = null;
            bold = false;
            italic = false;
            underline = false;
            strike = false;
            obfuscated = false;
            break;
        }
      }
    } else if (part.length > 0) {
      segments.push({
        text: part,
        color: currentColor,
        bold,
        italic,
        underline,
        strike,
        obfuscated
      });
    }
  });

  return (
    <span>
      {segments.map((seg, i) => {
        const classes = [
          seg.color ? (minecraftColorClasses[seg.color] || '') : 'text-inherit',
          seg.bold ? 'font-black' : '', // Use font-black for better visibility of bold text
          seg.italic ? 'italic' : '',
          seg.underline ? 'underline' : '',
          seg.strike ? 'line-through' : '',
        ].filter(Boolean).join(' ');

        return (
          <span key={i} className={classes}>
            {seg.text}
          </span>
        );
      })}
    </span>
  );
};

const getExpTierStyle = (exp: number) => {
  if (exp < 100) return { bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-300 dark:border-slate-600', shadow: 'shadow-slate-500/20' }; // Iron
  if (exp < 300) return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-700', shadow: 'shadow-yellow-500/20' }; // Gold
  if (exp < 1000) return { bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-700', shadow: 'shadow-cyan-500/20' }; // Diamond
  if (exp < 3000) return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700', shadow: 'shadow-emerald-500/20' }; // Emerald
  if (exp < 10000) return { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-700', shadow: 'shadow-pink-500/20' }; // Master
  return { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-700', shadow: 'shadow-red-500/20' }; // King
};

const Leaderboard: React.FC = () => {
  const [type, setType] = useState<LeaderboardType>('kills');
  const [period, setPeriod] = useState<PeriodType>('total');
  const [data, setData] = useState<{ name: string; value: number; rank: string; exp: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [type, period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/server/kitbattle/leaderboard/${type}?limit=10&period=${period}`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: LeaderboardType; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { id: 'kills', label: '击杀数', icon: <Swords size={14} />, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
    { id: 'coins', label: '职业币', icon: <Coins size={14} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { id: 'exp', label: '经验', icon: <Star size={14} />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { id: 'deaths', label: '死亡数', icon: <Skull size={14} />, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-500/10' },
  ];

  const periods: { id: PeriodType; label: string }[] = [
    { id: 'total', label: '总榜' },
    { id: 'monthly', label: '月榜' },
    { id: 'weekly', label: '周榜' },
  ];

  const getPeriodLabel = (p: PeriodType) => {
    const now = new Date();
    if (p === 'weekly') {
       const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
       const dayNum = date.getUTCDay() || 7;
       date.setUTCDate(date.getUTCDate() + 4 - dayNum);
       const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
       const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
       return `${now.getFullYear()}年 第${weekNo}周`;
    } else if (p === 'monthly') {
      return `${now.getFullYear()}年 ${now.getMonth() + 1}月`;
    }
    return '全服总榜';
  };

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
      case 1: return 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-400/50 bg-slate-50 dark:bg-slate-500/10 shadow-[0_0_15px_rgba(148,163,184,0.2)]';
      case 2: return 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/50 bg-orange-50 dark:bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]';
      default: return 'text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/20';
    }
  };

  return (
    <div className="w-full space-y-6 p-2">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_linear_infinite] pointer-events-none" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-xl border border-brand-100 dark:border-brand-500/20 text-brand-600 dark:text-brand-400 shadow-sm">
            <BarChart2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">排行榜</h2>
            <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">{getPeriodLabel(period)}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    period === 'total' 
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' 
                        : 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                }`}>
                    {period === 'total' ? '历史累计' : period === 'weekly' ? '本周新增' : '本月新增'}
                </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10 overflow-x-auto max-w-full no-scrollbar">
          {/* Period Toggle */}
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-lg">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  period === p.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-white/10 hidden md:block" />

          {/* Type Tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setType(tab.id)}
                className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2 border ${
                  type === tab.id
                    ? 'text-brand-600 dark:text-white border-brand-200 dark:border-white/20 bg-brand-50 dark:bg-white/5 shadow-sm'
                    : 'text-slate-500 dark:text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <span className={type === tab.id ? '' : 'grayscale opacity-50'}>{tab.icon}</span>
                {tab.label}
                {type === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-brand-50/50 dark:bg-white/5 rounded-lg -z-10"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 border-2 border-brand-200 dark:border-cyan-500/30 border-t-brand-500 dark:border-t-cyan-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 border-2 border-purple-200 dark:border-purple-500/30 border-b-purple-500 rounded-full animate-spin-reverse scale-75" />
                </div>
                <span className="text-xs text-brand-500 dark:text-cyan-400 font-sans animate-pulse tracking-widest">正在加载数据...</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              className="grid gap-2"
            >
              {data.length > 0 ? (
                data.map((item, index) => (
                  <motion.div
                    key={item.name}
                    variants={{
                        hidden: { opacity: 0, x: -20, y: 10, filter: "blur(4px)" },
                        visible: { 
                            opacity: 1, 
                            x: 0, 
                            y: 0,
                            filter: "blur(0px)",
                            transition: { type: "spring", stiffness: 400, damping: 25 }
                        }
                    }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative flex items-center p-3 rounded-xl transition-all duration-300 border hover:shadow-md ${
                      index < 3 
                        ? 'bg-gradient-to-r from-slate-50 to-white dark:from-white/5 dark:to-transparent border-slate-200 dark:border-white/10' 
                        : 'bg-white/50 dark:bg-transparent border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/5 hover:border-slate-200 dark:hover:border-white/20'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className={`
                      relative w-10 h-10 flex items-center justify-center rounded-lg font-black text-xl italic mr-4 shrink-0 font-sans border overflow-hidden
                      ${getRankStyle(index)}
                    `}>
                        {index < 3 && (
                            <motion.div 
                                className="absolute inset-0 bg-white/30 skew-x-[-20deg]"
                                initial={{ x: '-150%' }}
                                animate={{ x: '150%' }}
                                transition={{ repeat: Infinity, duration: 2, delay: index * 0.5, ease: "easeInOut", repeatDelay: 1 }}
                            />
                        )}
                      <span className="z-10 relative">#{index + 1}</span>
                    </div>

                    {/* Avatar & Name */}
                    <div className="flex-1 flex items-center gap-4 min-w-0">
                      <div className="relative">
                        <img 
                          src={`https://cravatar.eu/helmavatar/${item.name}/48.png`} 
                          alt={item.name} 
                          className={`w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 object-cover ${
                            index < 3 ? 'ring-2 ring-white dark:ring-white/10 shadow-lg' : ''
                          }`}
                          loading="lazy"
                        />
                         {/* Corner accents */}
                        <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-slate-400 dark:border-white/50 rounded-tl-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r border-slate-400 dark:border-white/50 rounded-br-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-base truncate ${
                            index === 0 ? 'text-yellow-600 dark:text-yellow-400' :
                            index === 1 ? 'text-slate-600 dark:text-slate-300' :
                            index === 2 ? 'text-orange-600 dark:text-orange-400' :
                            'text-slate-700 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                          }`}>
                            {item.name}
                          </h3>
                          {item.rank && (() => {
                            const style = getExpTierStyle(item.exp || 0);
                            return (
                              <span 
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all duration-300 ${style.bg} ${style.border} ${style.shadow}`}
                              >
                                <span style={{ filter: 'saturate(0.6)' }}>
                                  {renderMinecraftText(item.rank)}
                                </span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-right pl-4">
                      <div className={`text-xl font-black font-sans tracking-tighter ${
                        tabs.find(t => t.id === type)?.color || 'text-slate-900 dark:text-white'
                      } drop-shadow-sm`}>
                        {item.value.toLocaleString()}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                        {tabs.find(t => t.id === type)?.label}
                      </div>
                    </div>

                    {/* Hover Glow */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mix-blend-overlay" />
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
                  <div className="text-4xl mb-2 opacity-50">📂</div>
                  <p className="font-sans text-xs uppercase tracking-widest">暂无排名数据</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Leaderboard;
