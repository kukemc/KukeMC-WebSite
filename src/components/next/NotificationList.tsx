'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, MessageSquare, Heart, Image, AtSign, Star, UserPlus, Zap } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead, Notification } from '@/services/notification';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';

export const NotificationList = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  const handleRead = async (id: number) => {
    if (!notifications.find(n => n.id === id)?.is_read) {
        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'profile_like': return <Heart className="text-red-500" size={12} />;
      case 'photo_like': return <Heart className="text-pink-500" size={12} />;
      case 'profile_message': return <MessageSquare className="text-blue-500" size={12} />;
      case 'message_reply': return <MessageSquare className="text-emerald-500" size={12} />;
      case 'photo_comment': return <Image className="text-purple-500" size={12} />;
      case 'message_like': return <Heart className="text-red-400" size={12} />;
      case 'ticket_reply': return <MessageSquare className="text-brand-500" size={12} />;
      case 'mention': return <AtSign className="text-emerald-500" size={12} />;
      case 'post_like': return <Heart className="text-red-500" size={12} />;
      case 'post_comment': return <MessageSquare className="text-blue-500" size={12} />;
      case 'post_collect': return <Star className="text-yellow-500" size={12} />;
      case 'follow': return <UserPlus className="text-indigo-500" size={12} />;
      case 'system': return <Zap className="text-yellow-500" size={12} />;
      
      // Missing types that might be used
      case 'photo_collect': return <Star className="text-yellow-500" size={12} />;
      case 'album_like': return <Heart className="text-pink-500" size={12} />;
      case 'album_collect': return <Star className="text-yellow-500" size={12} />;
      case 'album_comment': return <MessageSquare className="text-purple-500" size={12} />;

      default: 
        // Fuzzy match fallback
        if (type.includes('like')) return <Heart className="text-red-500" size={12} />;
        if (type.includes('comment') || type.includes('reply')) return <MessageSquare className="text-blue-500" size={12} />;
        if (type.includes('collect')) return <Star className="text-yellow-500" size={12} />;
        if (type.includes('follow')) return <UserPlus className="text-indigo-500" size={12} />;
        return <Bell size={12} />;
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'profile_like': return '赞了你的个人主页';
      case 'photo_like': return '赞了你的相册';
      case 'profile_message': return '给你的个人主页留言';
      case 'message_reply': return '回复了你的留言';
      case 'photo_comment': return '评论了你的相册';
      case 'message_like': return '赞了你的留言';
      case 'ticket_reply': return '回复了你的工单';
      case 'mention': return '提到了你';
      case 'post_like': return '赞了你的动态';
      case 'post_comment': return '评论了你的动态';
      case 'post_collect': return '收藏了你的动态';
      case 'follow': return '关注了你';
      case 'system': return '发来了系统通知';

      // Missing types
      case 'photo_collect': return '收藏了你的照片';
      case 'album_like': return '赞了你的相册';
      case 'album_collect': return '收藏了你的相册';
      case 'album_comment': return '评论了你的相册';

      default: 
        // Fuzzy match fallback
        if (type.includes('like')) return '赞了你的内容';
        if (type.includes('comment')) return '评论了你的内容';
        if (type.includes('collect')) return '收藏了你的内容';
        if (type.includes('reply')) return '回复了你';
        if (type.includes('follow')) return '关注了你';
        
        return `有新的通知 (${type})`;
    }
  };

  const getLink = (n: Notification) => {
    switch (n.type) {
        case 'profile_like': return `/player/${n.sender_id}`;
        
        // Need to ensure these query params are handled in Profile.tsx
        case 'photo_like': return `/player/${n.user_id}?tab=album&photo=${n.target_id}`; 
        case 'photo_comment': return `/player/${n.user_id}?tab=album&photo=${n.target_id}`;
        case 'photo_collect': return `/player/${n.user_id}?tab=album&photo=${n.target_id}`;

        case 'album_like': 
        case 'album_collect': 
        case 'album_comment': 
            return `/player/${n.user_id}?tab=albums`;
        
        case 'profile_message': return `/player/${n.user_id}?msg=${n.target_id}`;
        case 'message_reply': return `/player/${n.user_id}?msg=${n.target_id}`;
        case 'message_like': return `/player/${n.user_id}?msg=${n.target_id}`;
        
        case 'ticket_reply': return `/tickets?id=${n.target_id}`;

        case 'mention': 
        case 'post_like':
        case 'post_comment':
        case 'post_collect':
            return `/activity/${n.target_id}`;
            
        case 'follow':
            return `/player/${n.sender_id}`;

        case 'system':
            return n.target_id || '#';
            
        default:  
             // Fuzzy match
            if (n.type.includes('album') || n.type.includes('photo')) {
                return `/player/${n.user_id}?tab=albums`;
            }
            if (n.type.includes('post')) {
                return `/activity/${n.target_id}`;
            }
            
            // Default fallback to sender's profile if nothing else matches
            if (n.sender_id && n.sender_id !== 'system') {
                return `/player/${n.sender_id}`;
            }
            return '#';
    }
  };

  if (!user) return null;

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell size={20} className={clsx("text-slate-600 dark:text-slate-300", unreadCount > 0 && "animate-pulse-slow")} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 max-h-[480px] flex flex-col"
            >
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shrink-0">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">通知</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <Check size={10} /> 全部已读
                  </button>
                )}
              </div>
              
              <div className="overflow-y-auto flex-1 p-1 space-y-0.5 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    暂无通知
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id}
                      className={clsx(
                        "relative group p-2 rounded-lg transition-all duration-200 border border-transparent cursor-pointer",
                        !n.is_read ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                      onClick={() => handleRead(n.id)}
                    >
                      <Link href={getLink(n)} className="flex gap-2.5 items-start">
                        <div className="mt-0.5 flex-shrink-0 relative">
                           {n.sender_id === 'system' ? (
                             <div className="w-8 h-8 rounded-lg shadow-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                               <Bell size={14} className="text-slate-500" />
                             </div>
                           ) : (
                             <img 
                               src={`https://cravatar.eu/helmavatar/${n.sender_id}/32.png`} 
                               className="w-8 h-8 rounded-lg shadow-sm"
                               alt={n.sender_id}
                             />
                           )}
                           <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-[2px] shadow-sm ring-1 ring-white dark:ring-slate-900">
                             {getIcon(n.type)}
                           </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate">
                            {n.title ? (
                                <span className="font-bold">{n.title}</span>
                            ) : (
                                <>
                                    <span className="font-bold">{n.sender_id}</span>
                                    <span className="font-normal ml-1 text-slate-500 dark:text-slate-400">{getActionText(n.type)}</span>
                                </>
                            )}
                          </p>
                          {(n.content || n.content_preview) && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {n.content || n.content_preview}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      </Link>
                      {!n.is_read && (
                        <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
