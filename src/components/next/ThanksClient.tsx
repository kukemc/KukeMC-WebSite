'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, ExternalLink, Calendar, MessageCircle, Zap, Sparkles, Star, Loader2, AlertCircle, Code, Users } from 'lucide-react';
import api from '@/utils/api';
import { getLeaderboard, LeaderboardEntry } from '@/services/leveling';
import Link from 'next/link';

interface Sponsor {
  id: number;
  name: string;
  name_color?: string;
  nameColor?: string;
  amount: number;
  amount_color?: string;
  amountColor?: string;
  message: string;
  platform: string;
  date: string;
  link?: string;
}

const platformColors: Record<string, string> = {
  WeChat: 'bg-[#09bb07]/10 text-[#09bb07] border-[#09bb07]/20',
  Alipay: 'bg-[#1678ff]/10 text-[#1678ff] border-[#1678ff]/20',
  QQ: 'bg-[#12b7f5]/10 text-[#12b7f5] border-[#12b7f5]/20',
  afdian: 'bg-[#946ce6]/10 text-[#946ce6] border-[#946ce6]/20',
};

const platformNames: Record<string, string> = {
  WeChat: '微信支付',
  Alipay: '支付宝',
  QQ: 'QQ支付',
  afdian: '爱发电',
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

interface Contributor {
  name: string;
  role: string;
  avatar: string;
  desc: string;
}

const developers: Contributor[] = [
  {
    name: "kukemc",
    role: "全栈开发 / 插件开发",
    avatar: "https://crafthead.net/helm/kukemc/128",
    desc: "主导网站全栈架构与核心功能开发，负责服务器插件深度定制与系统对接，优化交互体验。"
  },
  {
    name: "0ctber",
    role: "运维 / 数据库",
    avatar: "https://crafthead.net/helm/0ctber/128",
    desc: "专注服务器高可用运维与数据库性能优化，保障系统稳定运行，提供安全可靠的游戏环境。"
  },
  {
    name: "sipc_ink",
    role: "服务器支持",
    avatar: "https://crafthead.net/helm/sipc_ink/128",
    desc: "提供了整个KukeMC游戏的服务器支持，为游戏世界的持续运行与稳定连接提供了坚实基础。"
  }
];

const techStack = [
  { name: "Next.js 14", icon: Code },
  { name: "React", icon: Code },
  { name: "TypeScript", icon: Code },
  { name: "Tailwind CSS", icon: Code },
  { name: "Framer Motion", icon: Star },
  { name: "FastAPI", icon: Code },
  { name: "PostgreSQL", icon: Code },
  { name: "Redis", icon: Code },
];

const ThanksClient = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const donate = {
    "text": "捐赠的所有收入将全部用于维护服务器！",
    "link": "https://afdian.com/a/kukemc",
    "images": [
      {
        "src": "https://m.ccw.site/gandi_application/user_assets/7ebd7661e9bc19c088de1b7825673b57.jpg",
        "name": "微信支付"
      },
      {
        "src": "https://m.ccw.site/gandi_application/user_assets/10dd46a5d2ccabc91d2ab9ca6f11b707.jpg",
        "name": "支付宝"
      }
    ]
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sponsorsRes, leaderboardRes] = await Promise.all([
           api.get<Sponsor[]>('/api/thanks/'),
           getLeaderboard(60) // Fetch enough for the wall
        ]);

        const mappedSponsors = sponsorsRes.data.map(item => ({
          ...item,
          nameColor: item.name_color,
          amountColor: item.amount_color
        }));
        setSponsors(mappedSponsors);
        setTopPlayers(leaderboardRes || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("无法加载赞助列表，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const displayPlayers = topPlayers.length > 0 ? topPlayers : Array.from({length: 20}, (_, i) => ({ username: `Player${i+1}` } as any));

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center p-4 bg-red-100 dark:bg-red-900/20 rounded-full mb-6 text-red-500"
          >
            <Heart size={48} className="fill-current" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6"
          >
            鸣谢列表
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            KukeMC 的诞生与发展离不开每一位贡献者的付出。
            <br />
            感谢你们的热爱、才华与支持。
          </motion.p>
        </div>

        {/* Developers Section */}
        <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20"
        >
            <div className="flex items-center gap-4 mb-8 justify-center">
                <Code className="text-blue-500" size={32} />
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">开发团队</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {developers.map((dev, index) => {
                    const isSpecial = dev.name === "sipc_ink";
                    return (
                        <motion.div
                            key={dev.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`bg-white/80 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex gap-4 items-start ${
                                isSpecial 
                                    ? "border-amber-200 dark:border-amber-700/50 shadow-amber-100 dark:shadow-amber-900/10 relative overflow-hidden" 
                                    : "border-slate-200 dark:border-slate-800"
                            }`}
                        >
                            {isSpecial && (
                                <div className="absolute -right-12 top-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-12 py-1 rotate-45 shadow-sm z-10">
                                    特别鸣谢
                                </div>
                            )}
                            
                            <Link href={`/player/${dev.name}`} className="shrink-0 relative">
                                <img 
                                    src={dev.avatar} 
                                    alt={dev.name} 
                                    className={`w-16 h-16 rounded-xl border-2 shadow-sm ${
                                        isSpecial 
                                            ? "border-amber-400 dark:border-amber-500" 
                                            : "border-slate-100 dark:border-slate-700"
                                    }`}
                                />
                                {isSpecial && (
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                        className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-amber-200 dark:border-amber-700"
                                    >
                                        <Heart size={12} className="text-red-500 fill-red-500" />
                                    </motion.div>
                                )}
                            </Link>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    {dev.name}
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-normal ${
                                        isSpecial
                                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50"
                                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                    }`}>
                                        {dev.role}
                                    </span>
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
                                    {dev.desc}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>

        {/* Players Section */}
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20 relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-800"
        >
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative z-10 grid lg:grid-cols-2 gap-12 p-8 md:p-12 lg:p-16 items-center">
                {/* Left Content */}
                <div className="text-left space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium backdrop-blur-sm"
                    >
                        <Sparkles size={16} className="animate-pulse" />
                        <span>致每一位冒险家</span>
                    </motion.div>

                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
                            你们是 KukeMC <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                                最耀眼的星光
                            </span>
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                            从第一次踏入这片土地，到每一次创造奇迹。是你们的探索、建筑与欢笑，赋予了代码生命，让 KukeMC 成为了一个有温度的世界。
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col gap-1">
                            <span className="text-3xl font-bold text-slate-900 dark:text-white">∞</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">无限可能</span>
                        </div>
                        <div className="w-px h-12 bg-slate-200 dark:bg-slate-800" />
                        <div className="flex flex-col gap-1">
                            <span className="text-3xl font-bold text-slate-900 dark:text-white">100%</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">热爱</span>
                        </div>
                        <div className="w-px h-12 bg-slate-200 dark:bg-slate-800" />
                         <div className="flex flex-col gap-1">
                            <span className="text-3xl font-bold text-slate-900 dark:text-white">You</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">不可或缺</span>
                        </div>
                    </div>
                </div>

                {/* Right Visual - Avatar Wall */}
                <div className="relative h-[400px] w-full overflow-hidden rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm">
                    {/* Gradient Overlays */}
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-900/80 dark:to-transparent z-10" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-900/80 dark:to-transparent z-10" />
                    
                    {/* Scrolling Columns */}
                    <div className="grid grid-cols-3 gap-4 h-full p-4 -rotate-6 scale-110 opacity-80">
                         {/* Column 1 */}
                         <motion.div 
                            animate={{ y: ["-50%", "0%"] }}
                            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                            className="flex flex-col gap-4"
                         >
                             {[...Array(16)].map((_, i) => (
                                <Link key={`c1-${i}`} href={`/player/${displayPlayers[i % displayPlayers.length].username}`}>
                                    <img src={`https://cravatar.eu/helmavatar/${displayPlayers[i % displayPlayers.length].username}/128.png`} className="w-full aspect-square rounded-xl shadow-lg border border-white dark:border-slate-700 bg-white dark:bg-slate-800 hover:scale-110 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 cursor-pointer" alt="Player" />
                                </Link>
                             ))}
                         </motion.div>
                         
                         {/* Column 2 */}
                         <motion.div 
                            animate={{ y: ["0%", "-50%"] }}
                            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                            className="flex flex-col gap-4"
                         >
                             {[...Array(16)].map((_, i) => (
                                <Link key={`c2-${i}`} href={`/player/${displayPlayers[(i + 5) % displayPlayers.length].username}`}>
                                    <img src={`https://crafthead.net/helm/${displayPlayers[(i + 5) % displayPlayers.length].username}/128`} className="w-full aspect-square rounded-xl shadow-lg border border-white dark:border-slate-700 bg-white dark:bg-slate-800 hover:scale-110 hover:border-brand-400 transition-all duration-300 cursor-pointer" alt="Player" />
                                </Link>
                             ))}
                         </motion.div>

                         {/* Column 3 */}
                         <motion.div 
                            animate={{ y: ["-50%", "0%"] }}
                            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                            className="flex flex-col gap-4"
                         >
                             {[...Array(16)].map((_, i) => (
                                <Link key={`c3-${i}`} href={`/player/${displayPlayers[(i + 10) % displayPlayers.length].username}`}>
                                    <img src={`https://crafthead.net/helm/${displayPlayers[(i + 10) % displayPlayers.length].username}/128`} className="w-full aspect-square rounded-xl shadow-lg border border-white dark:border-slate-700 bg-white dark:bg-slate-800 hover:scale-110 hover:border-brand-400 transition-all duration-300 cursor-pointer" alt="Player" />
                                </Link>
                             ))}
                         </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>

        {/* Sponsors Section (Dynamic) */}
        <div className="flex items-center gap-4 mb-8 justify-center">
            <Users className="text-emerald-500" size={32} />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">赞助鸣谢</h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm">正在加载赞助列表...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-red-400 gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20"
          >
            {sponsors.map((sponsor, index) => (
              <motion.div
                key={sponsor.id || index}
                variants={item}
                className="group relative bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-lg border border-slate-200 dark:border-slate-700">
                      {sponsor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      {sponsor.link ? (
                        <a
                          href={sponsor.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`font-bold text-lg flex items-center gap-1 hover:underline ${sponsor.nameColor ? `text-${sponsor.nameColor}-500` : 'text-slate-900 dark:text-white'}`}
                          style={sponsor.nameColor ? { color: sponsor.nameColor } : {}}
                        >
                          {sponsor.name}
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                      ) : (
                        <span
                          className={`font-bold text-lg ${sponsor.nameColor ? '' : 'text-slate-900 dark:text-white'}`}
                          style={sponsor.nameColor ? { color: sponsor.nameColor } : {}}
                        >
                          {sponsor.name}
                        </span>
                      )}
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {sponsor.date}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${platformColors[sponsor.platform] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                    {platformNames[sponsor.platform] || sponsor.platform}
                  </span>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-sm text-slate-500 dark:text-slate-400">赞助了</span>
                  <span
                      className={`text-2xl font-bold font-mono ${!sponsor.amountColor ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
                      style={sponsor.amountColor ? { color: sponsor.amountColor } : {}}
                  >
                      ¥{sponsor.amount}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800/50 relative">
                  <MessageCircle className="w-4 h-4 text-slate-400 dark:text-slate-600 absolute top-4 left-4" />
                  <p className="text-slate-600 dark:text-slate-300 text-sm pl-6 italic break-all">
                    "{sponsor.message}"
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Donate Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center md:p-12 shadow-2xl dark:shadow-slate-900/50"
        >
            {/* Dynamic Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3], 
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px]"
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3], 
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-purple-500/10 dark:bg-purple-500/20 blur-[100px]"
                />
            </div>

            <div className="absolute inset-0 bg-grid-slate-900/[0.02] dark:bg-grid-white/[0.02] bg-[size:32px_32px]" />
            
            <div className="relative z-10">
                <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/30 relative"
                >
                    <div className="absolute inset-0 rounded-3xl bg-white/30 animate-pulse" />
                    <Heart className="relative z-10 h-10 w-10 text-white fill-white" />
                </motion.div>
                
                <div className="relative inline-block mb-6">
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">支持我们</h2>
                    <motion.div 
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        className="absolute -right-10 -top-6"
                    >
                        <Sparkles className="h-8 w-8 text-yellow-400" />
                    </motion.div>
                </div>
                
                <p className="mx-auto mb-12 max-w-2xl text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {donate.text}
                </p>
                
                <div className="mx-auto mb-16 flex max-w-4xl flex-col justify-center gap-8 md:flex-row items-center">
                    {donate.images.map((img, idx) => (
                        <motion.div 
                            key={idx} 
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800 p-4 shadow-xl border border-slate-100 dark:border-slate-700 transition-all duration-300 max-w-sm w-full"
                        >
                            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                                <img 
                                    src={img.src} 
                                    alt={img.name} 
                                    className="h-full w-full object-contain p-1 transition-transform duration-500 group-hover:scale-110" 
                                />
                            </div>
                            <div className="mt-4 flex items-center justify-between px-2">
                                <span className="font-bold text-slate-800 dark:text-white text-lg">{img.name}</span>
                                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">扫码支付</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.a
                    href={donate.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-slate-900 dark:bg-white px-10 py-5 text-lg font-bold text-white dark:text-slate-900 transition-all duration-300 shadow-2xl hover:shadow-xl hover:shadow-indigo-500/20"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <Zap className="h-5 w-5 fill-current" />
                        前往爱发电赞助
                    </span>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
                </motion.a>
            </div>
        </motion.div>

        {/* Tech Stack Section */}
        <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20 mt-20 bg-slate-50 dark:bg-slate-900/30 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800"
        >
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">技术栈</h2>
                <p className="text-slate-500 dark:text-slate-400">构建 KukeMC 网站的核心技术</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
                {techStack.map((tech, index) => (
                    <motion.div
                        key={tech.name}
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05, type: "spring" }}
                        className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium"
                    >
                        <tech.icon size={16} className="text-slate-400" />
                        {tech.name}
                    </motion.div>
                ))}
            </div>
        </motion.div>

        {/* Footer Note */}
        <div className="mt-20 text-center text-slate-400 text-sm">
             <p>Made with <Heart size={14} className="inline text-red-500 fill-current mx-1" /> by KukeMC Team</p>
        </div>

      </div>
    </div>
  );
};

export default ThanksClient;
