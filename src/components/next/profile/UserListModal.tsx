'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  X, Loader2, Users, ChevronRight
} from 'lucide-react';

const UserListModal = ({ 
  isOpen, 
  onClose, 
  title, 
  users, 
  loading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  users: { username: string; nickname?: string; avatar_url?: string }[]; 
  loading: boolean; 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-800 m-4"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                  </div>
                ) : users.length > 0 ? (
                  <div className="space-y-3">
                    {users.map((u) => (
                      <Link 
                        key={u.username} 
                        href={`/player/${u.username}`}
                        onClick={onClose}
                        className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                      >
                        <div className="relative">
                          <img 
                            src={`https://cravatar.eu/helmavatar/${u.username}/48.png`} 
                            alt={u.username}
                            className="w-12 h-12 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                             <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors truncate text-base">
                               {u.nickname || u.username}
                             </div>
                             {u.nickname && u.nickname !== u.username && (
                               <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-mono">
                                 {u.username}
                               </span>
                             )}
                          </div>
                          <div className="text-xs text-slate-500 truncate mt-0.5">
                            访问主页
                          </div>
                        </div>
                        <div className="text-slate-300 group-hover:text-emerald-500 transition-colors">
                          <ChevronRight size={18} />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                       <Users size={24} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p>暂时没有用户</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserListModal;
