'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User, ArrowRight, LogIn, Search, Sparkles } from 'lucide-react';
import clsx from 'clsx';

// --- Visual Components (Duplicated for standalone page) ---

const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-purple-300/30 dark:bg-purple-900/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
      <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-300/30 dark:bg-indigo-900/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-[80vw] h-[80vw] bg-pink-300/30 dark:bg-fuchsia-900/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
    </div>
  );
};

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
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

export default function Year2025Landing() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');

  // Auto-fill username if logged in
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  const handleSearch = () => {
    if (username.trim()) {
      router.push(`/year2025/${encodeURIComponent(username.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-500">
      <ParticleBackground />
      
      <GlassCard className="w-full max-w-md p-8 md:p-12 z-10 mx-4 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="inline-block mb-6 relative"
        >
          <div className="absolute inset-0 bg-brand-500/30 blur-2xl rounded-full" />
          <h1 className="text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent relative z-10">
            2025
          </h1>
        </motion.div>
        
        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">KukeMC 年度时光机</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          输入游戏 ID，<br/>
          开启属于你的年度回忆。
        </p>

        <div className="space-y-4">
            <div className="relative group text-left">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入游戏 ID"
                className="w-full bg-slate-100/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-lg font-medium outline-none focus:ring-2 focus:ring-brand-500/50 transition-all placeholder:text-slate-400 dark:text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <button
                onClick={handleSearch}
                disabled={!username}
                className="w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg shadow-brand-500/20"
            >
                {user?.username === username ? (
                    <>
                        <span>查看我的报告</span>
                        <ArrowRight size={20} />
                    </>
                ) : (
                    <>
                        <Search size={20} />
                        <span>查询</span>
                    </>
                )}
            </button>
            
            {!user && (
                <button
                    onClick={() => router.push('/login?redirect=/year2025')}
                    className="w-full py-3 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <LogIn size={16} />
                    登录账号
                </button>
            )}
        </div>
      </GlassCard>
      
      <div className="absolute bottom-8 text-slate-400 dark:text-slate-600 text-sm flex items-center gap-2">
         <Sparkles size={14} />
         <span>Created for KukeMC Community</span>
      </div>
    </div>
  );
}
