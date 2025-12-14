import React, { useState } from 'react';
import { CheckInStatus, performWebCheckIn } from '../../services/leveling';
import { X, Calendar as CalendarIcon, Check, Sparkles } from 'lucide-react';
import ModalPortal from '../ModalPortal';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useToast } from '../../context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  status: CheckInStatus | null;
  username: string;
  onCheckInSuccess: () => void;
}

const CheckInModal: React.FC<Props> = ({ isOpen, onClose, status, username, onCheckInSuccess }) => {
  const { error } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentDate] = useState(new Date());
  const [reward, setReward] = useState<{ xp: number, streak: number, bonus_xp?: number } | null>(null);

  if (!isOpen) return null;

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await performWebCheckIn(username);
      if (res.status === 'success') {
          // Trigger Confetti
          const end = Date.now() + 1000;
          const colors = ['#3b82f6', '#8b5cf6', '#f59e0b'];

          (function frame() {
            confetti({
              particleCount: 3,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: colors
            });
            confetti({
              particleCount: 3,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: colors
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          }());

          setReward({ xp: res.xp_awarded, streak: res.streak, bonus_xp: res.bonus_xp });
          onCheckInSuccess();
      } else {
          error(res.message || "签到失败");
      }
    } catch (err) {
      console.error(err);
      error("签到失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };
  
  // Close handler to reset reward state
  const handleClose = () => {
      setReward(null);
      onClose();
  };
  
  // Skeleton Loading State
  if (!status) {
      return (
        <ModalPortal>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-pulse">
            <div className="h-32 bg-gray-200 dark:bg-gray-800"></div>
            <div className="p-6 space-y-6">
                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )
  }

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  
  // Adjust for Monday start if needed, but standard calendar is usually Sun-Sat or Mon-Sun.
  // Let's use Sun start for simplicity in rendering.
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isChecked = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return status.web.calendar.includes(dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isPast = (day: number) => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <ModalPortal>
    <AnimatePresence>
    {isOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800"
      >
        {reward ? (
             <div className="p-8 text-center py-16">
                 <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-xl"
                 >
                     <Sparkles className="text-white w-12 h-12" />
                 </motion.div>
                 
                 <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600 mb-2"
                 >
                     签到成功!
                 </motion.h2>
                 
                 <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-500 dark:text-gray-400 mb-8"
                 >
                     连续签到 <span className="font-bold text-blue-500">{reward.streak}</span> 天
                 </motion.p>
                 
                 <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col items-center justify-center gap-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 mb-8"
                 >
                     <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">获得奖励</span>
                        <span className="text-xl font-bold text-orange-500">+{reward.xp} XP</span>
                     </div>
                     {(reward.bonus_xp || 0) > 0 && (
                        <span className="text-xs text-orange-500 font-medium bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                            含每日全服首签奖励 +{reward.bonus_xp} XP
                        </span>
                     )}
                 </motion.div>

                 <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClose}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30"
                 >
                     收下奖励
                 </motion.button>
             </div>
        ) : (
        <>
        {/* Header */}
        <div className="relative h-36 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('/static/image/slime.jpg')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
            <div className="text-center z-10 text-white mt-2">
                <h2 className="text-3xl font-bold mb-1 tracking-tight">每日签到</h2>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium border border-white/20 mt-2">
                   <Sparkles size={14} className="text-yellow-300" />
                   连续签到 {status.web.streak} 天
                </div>
            </div>
            <button 
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors backdrop-blur-sm"
            >
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6">
            
            {/* Rewards Progress */}
            <div className="mb-8">
                <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                    <span>1天</span>
                    <span>7天</span>
                    <span>14天</span>
                    <span>30天</span>
                    <span>60+天</span>
                </div>
                <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(status.web.streak / 60 * 100, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </motion.div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                    <span>+60 XP</span>
                    <span>+80 XP</span>
                    <span>+110 XP</span>
                    <span>+150 XP</span>
                    <span>+200 XP</span>
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <CalendarIcon size={20} className="text-blue-500"/>
                        {year}年 {month + 1}月
                    </h3>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center">
                    {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                        <div key={d} className="text-xs font-bold text-gray-400 py-2">{d}</div>
                    ))}
                    {days.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`}></div>;
                        const checked = isChecked(day);
                        const today = isToday(day);
                        const past = isPast(day);
                        
                        return (
                            <div 
                                key={day} 
                                className={`
                                    relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-all border-2
                                    ${checked 
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                                        : past 
                                            ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 border-gray-100 dark:border-gray-800 grayscale' 
                                            : today
                                                ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-blue-500 shadow-lg shadow-blue-500/20 z-10 scale-105'
                                                : 'bg-white dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }
                                `}
                            >
                                <span className={past && !checked ? 'opacity-50' : ''}>{day}</span>
                                
                                {checked && (
                                    <div className="absolute bottom-1 right-1">
                                        <Check size={12} className="text-blue-500" strokeWidth={3} />
                                    </div>
                                )}
                                
                                {past && !checked && (
                                    <span className="absolute bottom-1 left-0 right-0 text-[9px] text-gray-400 dark:text-gray-600 font-medium leading-none">
                                        已过期
                                    </span>
                                )}

                                {today && !checked && (
                                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-sm">
                                        +{status.web.today_reward}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Action Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckIn}
                disabled={status.web.checked || loading}
                className={`
                    w-full py-3.5 rounded-xl font-bold text-lg shadow-lg
                    ${status.web.checked 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-blue-500/30'
                    }
                `}
            >
                {loading ? '签到中...' : status.web.checked ? '今日已签到' : '立即签到'}
            </motion.button>
            
            {!status.web.checked && (
                <div className="text-center mt-3 space-y-1">
                    <p className="text-xs text-gray-500">
                        今日签到可获得 <span className="text-blue-500 font-bold">{status.web.today_reward} XP</span>
                    </p>
                    {status.web.bonus_xp && status.web.bonus_xp > 0 ? (
                        <p className="text-[10px] text-orange-500 font-medium">
                            (含每日全服首签额外奖励 +{status.web.bonus_xp} XP)
                        </p>
                    ) : (
                        <p className="text-[10px] text-gray-400 font-medium">
                            (今日全服首签已被抢占)
                        </p>
                    )}
                </div>
            )}
        </div>
        </>
        )}
      </motion.div>
    </div>
    )}
    </AnimatePresence>
    </ModalPortal>
  );
};

export default CheckInModal;
