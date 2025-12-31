'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import api from '@/utils/api';
import { 
  User, Clock, MessageSquare, Calendar, Award, Moon, Share2, Search, 
  ArrowRight, Sparkles, Heart, Camera, Trophy, BarChart3, Medal, Zap, 
  Target, Flame, Map, Users, ChevronDown, Star, Crown, Hash, X, LogIn, Link as LinkIcon, Check, Image as ImageIcon
} from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

// --- Visual Components ---

const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Light Mode: Softer, pastel gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-purple-300/30 dark:bg-purple-900/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
      <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-300/30 dark:bg-indigo-900/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-[80vw] h-[80vw] bg-pink-300/30 dark:bg-fuchsia-900/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
    </div>
  );
};

const GlassCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, type: "spring", stiffness: 100 }}
    viewport={{ once: true }}
    className={clsx(
      "relative overflow-hidden backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl",
      "bg-white/40 dark:bg-slate-900/40 rounded-3xl",
      "hover:bg-white/50 dark:hover:bg-slate-900/50 transition-colors duration-300",
      className
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />
    {children}
  </motion.div>
);

const Section = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <section className={clsx("min-h-screen w-full flex flex-col items-center justify-center p-6 relative snap-start z-10", className)}>
    {children}
  </section>
);

const NumberTicker = ({ value }: { value: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    if (inView) {
      spring.set(value);
    }
  }, [spring, value, inView]);

  return <motion.span ref={ref}>{display}</motion.span>;
};

const ShareModal = ({ onClose }: { onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      success('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-white/20 text-center z-10"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={20} className="text-slate-500" />
        </button>

        <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-500">
          <Share2 size={32} />
        </div>

        <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">分享年度报告</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          复制链接分享给好友，<br/>
          或者截图保存你的精彩瞬间！
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleCopy}
            className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <LinkIcon size={18} />}
            {copied ? '已复制链接' : '复制页面链接'}
          </button>
          
          <div className="flex items-center gap-2 justify-center text-xs text-slate-400 mt-2">
             <Camera size={14} />
             <span>提示：使用手机截图或电脑截图保存图片</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Chart Components ---

const ModernBarChart = ({ data }: { data: { month: number, hours: number }[] }) => {
  const max = Math.max(...data.map(d => d.hours), 1);
  return (
    <div className="w-full max-w-4xl h-64 flex items-end justify-between gap-2 px-4">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-2 group flex-1 h-full justify-end">
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            whileInView={{ height: `${(d.hours / max) * 100}%`, opacity: 1 }}
            transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
            className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 dark:from-blue-600 dark:to-cyan-400 rounded-t-lg relative hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-shadow"
            style={{ minHeight: d.hours > 0 ? '4px' : '0' }}
          >
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 shadow-lg pointer-events-none z-20">
               {d.hours}h
             </div>
          </motion.div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{d.month}月</span>
        </div>
      ))}
    </div>
  );
};

const ServerPieChart = ({ data }: { data: { name: string, value: number }[] }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']; // blue, violet, pink, amber, emerald

  return (
    <div className="flex flex-wrap justify-center gap-8 w-full max-w-4xl">
      {data.slice(0, 5).map((item, index) => {
        const percent = ((item.value / total) * 100).toFixed(1);
        const color = colors[index % colors.length];
        
        return (
          <GlassCard key={index} delay={index * 0.1} className="p-6 flex flex-col items-center gap-4 w-40 hover:scale-105 transition-transform">
            <div className="relative w-24 h-24 flex items-center justify-center">
               <svg className="absolute inset-0 w-full h-full -rotate-90">
                 <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-slate-800" />
                 <motion.circle
                   cx="48" cy="48" r="40"
                   stroke={color}
                   strokeWidth="8"
                   fill="transparent"
                   strokeDasharray={`${(parseFloat(percent) / 100) * 251} 251`}
                   strokeLinecap="round"
                   initial={{ strokeDashoffset: 251 }}
                   whileInView={{ strokeDashoffset: 251 - ((parseFloat(percent) / 100) * 251) }}
                   transition={{ duration: 1.5, delay: 0.2 }}
                   viewport={{ once: true }}
                 />
               </svg>
               <span className="text-sm font-bold text-slate-700 dark:text-white">{percent}%</span>
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-800 dark:text-white text-sm truncate w-32" title={item.name}>{item.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.value} 消息</div>
            </div>
          </GlassCard>
        )
      })}
    </div>
  );
}

// --- Main Page Component ---

export default function Year2025UserPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!username) return;
      
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/api/year2025/summary', { params: { player: username } });
        setData(res.data);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.detail || '获取数据失败，请确认是否已有游戏数据');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden text-slate-900 dark:text-white">
        <ParticleBackground />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-24 h-24 border-4 border-brand-500/30 border-t-brand-500 rounded-full mb-8 z-10"
        />
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-xl font-medium text-slate-600 dark:text-slate-300 z-10"
        >
          正在穿越时空隧道...
        </motion.p>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden text-slate-900 dark:text-white">
        <ParticleBackground />
        <GlassCard className="p-8 max-w-md text-center">
          <div className="text-red-500 mb-4 mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <X size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">无法加载报告</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error || '未找到数据'}</p>
          <button
             onClick={() => router.push('/year2025')}
             className="px-6 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
          >
            返回首页
          </button>
        </GlassCard>
      </div>
    );
  }

  // --- Report View ---

  const { playtime, chat, activity, bans, rank, join, social, monthly, titles, global_rank, growth, server_distribution, global_stats } = data;

  return (
    <div 
      ref={containerRef}
      className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white h-screen overflow-y-scroll overflow-x-hidden snap-y snap-mandatory scroll-smooth"
      style={{ scrollBehavior: 'smooth' }}
    >
      <ParticleBackground />
      <AnimatePresence>
        {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}
      </AnimatePresence>
      
      {/* 1. Intro Slide */}
      <Section>
        <div className="flex flex-col items-center relative z-10">
           <motion.div
             initial={{ scale: 0, rotate: -180 }}
             whileInView={{ scale: 1, rotate: 0 }}
             transition={{ type: "spring", damping: 20, stiffness: 100 }}
             className="relative mb-8 group"
           >
             <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
             <img 
               src={`https://cravatar.eu/helmavatar/${data.player}/256.png`} 
               alt={data.player}
               className="w-48 h-48 rounded-2xl shadow-2xl relative z-10 bg-slate-800"
             />
             <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-4 py-1 rounded-full text-sm font-bold shadow-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap z-20 flex items-center gap-1">
               <Crown size={14} className="text-yellow-500" />
               <span>Lv.{growth?.level || 1}</span>
             </div>
           </motion.div>

           <motion.h1 
             initial={{ y: 50, opacity: 0 }}
             whileInView={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="text-5xl md:text-7xl font-black mb-4 text-center bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent"
           >
             你好，{data.player}
           </motion.h1>
           
           <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 text-center max-w-2xl"
           >
             这是属于你的 <span className="text-brand-600 dark:text-brand-400 font-bold">2025</span> 独家记忆
           </motion.p>
        </div>

        <motion.div 
          initial={{ x: "-50%", opacity: 0 }}
          animate={{ y: [0, 10, 0], opacity: 1 }} 
          transition={{ 
            y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
            opacity: { duration: 1, delay: 1 }
          }}
          className="absolute bottom-4 md:bottom-10 left-1/2 text-slate-400 flex flex-col items-center gap-1 md:gap-2 cursor-pointer z-20"
          onClick={() => containerRef.current?.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span className="text-xs md:text-sm font-medium tracking-widest uppercase">Start Journey</span>
          <ChevronDown size={20} className="md:w-6 md:h-6" />
        </motion.div>
      </Section>

      {/* 2. Playtime Slide */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl items-center">
          <div className="order-2 lg:order-1">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <GlassCard className="p-8 flex flex-col items-start gap-2" delay={0.1}>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 mb-2">
                    <Clock size={32} />
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-medium">累计游玩</div>
                  <div className="text-4xl font-bold">
                    <NumberTicker value={playtime.total_hours} /> <span className="text-lg text-slate-400">h</span>
                  </div>
                </GlassCard>

                <GlassCard className="p-8 flex flex-col items-start gap-2" delay={0.2}>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl text-green-600 dark:text-green-400 mb-2">
                    <Calendar size={32} />
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-medium">活跃天数</div>
                  <div className="text-4xl font-bold">
                    <NumberTicker value={playtime.active_days} /> <span className="text-lg text-slate-400">d</span>
                  </div>
                </GlassCard>

                <GlassCard className="p-8 flex flex-col items-start gap-2 sm:col-span-2" delay={0.3}>
                   <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl text-yellow-600 dark:text-yellow-400">
                          <Trophy size={32} />
                        </div>
                        <div>
                          <div className="text-slate-500 dark:text-slate-400 font-medium">全服排名</div>
                          <div className="text-4xl font-bold">No.<NumberTicker value={rank.rank_num} /></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-500 dark:text-slate-400">超越了</div>
                        <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{rank.top_percent}%</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">的玩家</div>
                      </div>
                   </div>
                </GlassCard>
             </div>
          </div>
          
          <div className="order-1 lg:order-2 text-center lg:text-left">
            <motion.h2 
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-black mb-6 leading-tight"
            >
              这一年，<br/>
              你非常<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">勤奋</span>。
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed"
            >
              每一个日日夜夜的陪伴，<br/>
              都化作了这个世界里最坚实的基石。<br/>
              感谢你，把时间交给了 KukeMC。
            </motion.p>
          </div>
        </div>
      </Section>

      {/* 3. Monthly Activity */}
      <Section>
        <div className="flex flex-col items-center w-full max-w-5xl">
          <motion.h2 
            initial={{ y: -30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            className="text-3xl md:text-5xl font-bold mb-12 flex items-center gap-4"
          >
            <BarChart3 className="w-10 h-10 md:w-12 md:h-12 text-brand-500" />
            <span>你的<span className="text-brand-500">高光</span>时刻</span>
          </motion.h2>
          
          <GlassCard className="w-full p-8 md:p-12">
             <ModernBarChart data={monthly || []} />
             <div className="mt-8 text-center text-slate-500 dark:text-slate-400">
               <p>每个月都有新的故事发生</p>
             </div>
          </GlassCard>
        </div>
      </Section>

      {/* 4. Growth & Stats */}
      <Section>
        <div className="w-full max-w-6xl">
           <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">
             成长的<span className="text-yellow-500">足迹</span>
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <GlassCard className="p-8 flex flex-col items-center text-center gap-4" delay={0.1}>
                 <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 text-white">
                   <Zap size={40} fill="currentColor" />
                 </div>
                 <h3 className="text-2xl font-bold">等级 Lv.{growth?.level || 0}</h3>
                 <p className="text-slate-500 dark:text-slate-400">总经验值 {Number(growth?.xp || 0).toLocaleString()}</p>
              </GlassCard>

              <GlassCard className="p-8 flex flex-col items-center text-center gap-4" delay={0.2}>
                 <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/30 text-white">
                   <Flame size={40} fill="currentColor" />
                 </div>
                 <h3 className="text-2xl font-bold">连签 {growth?.streak || 0} 天</h3>
                 <p className="text-slate-500 dark:text-slate-400">坚持是最宝贵的品质</p>
              </GlassCard>

              <GlassCard className="p-8 flex flex-col items-center text-center gap-4" delay={0.3}>
                 <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
                   <Target size={40} />
                 </div>
                 <h3 className="text-2xl font-bold">任务 {growth?.tasks_completed || 0} 个</h3>
                 <p className="text-slate-500 dark:text-slate-400">挑战自我，突破极限</p>
              </GlassCard>
           </div>
        </div>
      </Section>

      {/* 5. Server Distribution */}
      <Section>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl items-center">
            <div className="order-2 lg:order-1">
               {server_distribution && server_distribution.length > 0 ? (
                 <ServerPieChart data={server_distribution} />
               ) : (
                 <div className="text-center text-slate-500">暂无数据</div>
               )}
            </div>
            <div className="order-1 lg:order-2 text-center lg:text-right">
              <motion.h2 
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                className="text-3xl md:text-5xl font-bold mb-6"
              >
                世界<br/><span className="text-blue-500">这么大</span>
              </motion.h2>
              <p className="text-xl text-slate-500 dark:text-slate-400">
                你在 <span className="font-bold text-slate-800 dark:text-white">{server_distribution?.[0]?.name || '未知世界'}</span> 停留最久。<br/>
                那里一定有你留恋的风景吧？
              </p>
            </div>
         </div>
      </Section>

      {/* 6. Social */}
      <Section>
        <div className="w-full max-w-4xl relative">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="text-center mb-16"
          >
             <h2 className="text-3xl md:text-5xl font-bold mb-4">
               有趣的<span className="text-pink-500">灵魂</span>
             </h2>
             <p className="text-slate-500 dark:text-slate-400">在 KukeMC，你从不孤单</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <GlassCard className="p-6 flex flex-col items-center gap-3 text-center col-span-2 md:col-span-1" delay={0.1}>
                <MessageSquare className="text-blue-500" size={32} />
                <div className="text-2xl font-bold">{Number(chat.total_messages).toLocaleString()}</div>
                <div className="text-xs text-slate-500">条消息</div>
             </GlassCard>

             <GlassCard className="p-6 flex flex-col items-center gap-3 text-center col-span-2 md:col-span-1" delay={0.2}>
                <Heart className="text-red-500" size={32} fill="currentColor" />
                <div className="text-2xl font-bold">{social.profile_likes || 0}</div>
                <div className="text-xs text-slate-500">获赞</div>
             </GlassCard>

             <GlassCard className="p-6 flex flex-col items-center gap-3 text-center col-span-2 md:col-span-1" delay={0.3}>
                <Share2 className="text-pink-500" size={32} />
                <div className="text-2xl font-bold">{social.posts_created || 0}</div>
                <div className="text-xs text-slate-500">动态</div>
             </GlassCard>

             <GlassCard className="p-6 flex flex-col items-center gap-3 text-center col-span-2 md:col-span-1" delay={0.4}>
                <ImageIcon className="text-cyan-500" size={32} />
                <div className="text-2xl font-bold">{social.albums_created || 0}</div>
                <div className="text-xs text-slate-500">相册</div>
             </GlassCard>

             <GlassCard className="p-6 flex flex-col items-center gap-3 text-center col-span-2 md:col-span-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10" delay={0.5}>
                <div className="flex items-center gap-2 mb-2">
                   <Moon className="text-indigo-400" size={24} />
                   <span className="font-bold text-indigo-600 dark:text-indigo-300">深夜时刻</span>
                </div>
                {activity.latest_night_session?.time ? (
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                     <span className="font-bold block text-lg mb-1">{activity.latest_night_session.date}</span>
                     那天 <span className="text-indigo-500 font-bold">{activity.latest_night_session.time}</span>，你还在 <span className="font-bold">{activity.latest_night_session.server}</span> 奋斗
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">看来你是个早睡早起的好孩子</div>
                )}
             </GlassCard>
          </div>
        </div>
      </Section>

      {/* 7. Titles */}
      <Section>
         <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">
            你的<span className="text-purple-500">荣耀</span>徽章
         </h2>
         <div className="flex flex-wrap justify-center gap-6 max-w-5xl">
            {titles.map((title: any, i: number) => {
               // Resolve color classes
               const colorClass = title.color?.includes(" ") 
                 ? title.color 
                 : title.color 
                   ? `bg-${title.color}-500/20 border-${title.color}-500/50 text-${title.color}-500 shadow-${title.color}-500/20` 
                   : "bg-slate-800 border-slate-700 text-white";

               // Check for high-tier badges (usually gold/yellow/orange) to add extra effects
               const isLegendary = title.color?.includes("yellow") || title.color?.includes("orange") || title.color?.includes("purple") || title.color?.includes("red");
               
               return (
               <motion.div
                 key={i}
                 initial={{ scale: 0, rotateX: 90 }}
                 whileInView={{ scale: 1, rotateX: 0 }}
                 transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 15 }}
                 className="relative group cursor-default perspective-1000"
               >
                  <div className={clsx(
                    "relative px-8 py-4 rounded-xl border-2 font-bold text-lg shadow-xl transition-all duration-300 transform-gpu preserve-3d group-hover:scale-110 group-hover:-translate-y-2 flex items-center gap-3 overflow-hidden",
                    colorClass,
                    isLegendary ? "shadow-2xl" : ""
                  )}>
                     {/* Shine Effect */}
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine z-10" />
                     
                     {/* Glow Background for Legendary */}
                     {isLegendary && (
                       <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     )}

                     <div className="relative z-20 flex items-center gap-2">
                        {isLegendary ? <Crown size={20} className="animate-pulse" /> : <Medal size={20} />}
                        <span className="tracking-wide">{title.name}</span>
                     </div>
                  </div>
                  
                  {/* Enhanced Tooltip */}
                  <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-56 bg-slate-900/90 text-white text-sm p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none z-30 text-center backdrop-blur-md border border-white/10 shadow-2xl">
                     <div className="font-bold mb-1 text-slate-300">{title.name}</div>
                     <div className="text-slate-400 text-xs">{title.desc}</div>
                     <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-900/90" />
                  </div>
               </motion.div>
               );
            })}
         </div>
      </Section>

      {/* 8. Global Rank */}
      <Section>
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
               <Crown className="text-yellow-500" size={40} fill="currentColor" />
               <span>风云<span className="text-yellow-500">人物</span></span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400">2025 年度肝帝榜 TOP 5</p>
          </div>

          <div className="space-y-4">
             {global_rank?.playtime?.map((p: any, i: number) => (
               <motion.div
                 key={i}
                 initial={{ x: -20, opacity: 0 }}
                 whileInView={{ x: 0, opacity: 1 }}
                 transition={{ delay: i * 0.1 }}
                 className={clsx(
                   "flex items-center p-4 rounded-2xl border transition-all hover:scale-[1.02]",
                   i === 0 
                     ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 shadow-yellow-500/10 shadow-lg" 
                     : "bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                 )}
               >
                 <div className={clsx(
                   "w-10 h-10 flex items-center justify-center rounded-full font-bold mr-4 text-lg shadow-inner",
                   i === 0 ? "bg-yellow-400 text-white" : 
                   i === 1 ? "bg-slate-300 text-slate-700" : 
                   i === 2 ? "bg-orange-400 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                 )}>
                   {i + 1}
                 </div>
                 <img src={`https://cravatar.eu/helmavatar/${p.username}/40.png`} className="w-10 h-10 rounded-lg mr-4 shadow-sm" alt={p.username} />
                 <div className="flex-1 font-bold text-lg">{p.username}</div>
                 <div className="font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-md">{p.value}</div>
               </motion.div>
             ))}

             {/* User's own rank if not in top list */}
             {rank.rank_num > (global_rank?.playtime?.length || 0) && (
                <>
                  <div className="flex justify-center my-4">
                    <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                    </div>
                  </div>
                  <motion.div
                     initial={{ x: -20, opacity: 0 }}
                     whileInView={{ x: 0, opacity: 1 }}
                     className="flex items-center p-4 rounded-2xl border bg-brand-50/80 dark:bg-brand-900/20 border-brand-200 dark:border-brand-700/50 relative overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-brand-500/5 pointer-events-none" />
                     <div className="w-10 h-10 flex items-center justify-center rounded-full font-bold mr-4 text-lg shadow-inner bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-200 z-10">
                       {rank.rank_num}
                     </div>
                     <img src={`https://cravatar.eu/helmavatar/${data.player}/40.png`} className="w-10 h-10 rounded-lg mr-4 shadow-sm z-10" alt={data.player} />
                     <div className="flex-1 font-bold text-lg z-10">{data.player} <span className="text-xs font-normal text-slate-500 ml-2">(我)</span></div>
                     <div className="font-mono text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 px-3 py-1 rounded-md z-10">{playtime.total_hours}h</div>
                   </motion.div>
                </>
             )}
          </div>
        </div>
      </Section>

      {/* 9. Final / Thank You */}
      <Section className="text-center">
         <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="mb-8"
         >
            <div className="relative inline-block">
               <Heart className="w-24 h-24 text-red-500 animate-pulse" fill="currentColor" />
               <Sparkles className="absolute -top-4 -right-4 text-yellow-400 w-10 h-10 animate-bounce" />
            </div>
         </motion.div>
         
         <h1 className="text-4xl md:text-6xl font-black mb-8 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
           感恩有你
         </h1>
         
         <div className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 leading-relaxed max-w-3xl">
           <p className="mb-6">
             KukeMC 的世界因为有 <span className="font-bold text-slate-900 dark:text-white">{data.player}</span> 而更加精彩。<br/>
             你于 <span className="font-bold text-brand-600 dark:text-brand-400">{join.date}</span> 加入我们，<br/>
             那是我们故事开始的地方。
           </p>
           <p className="text-lg text-slate-500 italic">
             "Minecraft is infinite, and so are our memories."
           </p>
         </div>

         <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => {
                 setShowShareModal(true);
              }}
              className="px-8 py-3 rounded-full font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Share2 size={18} />
              分享我的报告
            </button>
         </div>

         <div className="mt-16 text-slate-400 text-sm">
           KukeMC 2025 Annual Report • Generated {new Date().toLocaleDateString()}
         </div>
      </Section>
    </div>
  );
}
