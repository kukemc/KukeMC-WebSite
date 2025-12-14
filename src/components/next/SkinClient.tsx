'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shirt, Upload, ExternalLink, Download, 
  HelpCircle, AlertTriangle, CheckCircle, 
  ChevronRight, X, Loader2 
} from 'lucide-react';
import api from '@/utils/api';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const SkinClient = () => {
  const { user } = useAuth();
  const { success, error: toastError, warning } = useToast();
  const [skinFile, setSkinFile] = useState<File | null>(null);
  const [capeFile, setCapeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'preview'>('upload');
  
  // Preview State
  const [previewUser, setPreviewUser] = useState('');
  const [previewType, setPreviewType] = useState<'3d' | '2d'>('3d');

  useEffect(() => {
    if (user) {
      setPreviewUser(user.username);
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'skin' | 'cape') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Basic validation
      if (file.size > 1024 * 1024) { // 1MB limit
        toastError('文件大小不能超过 1MB');
        return;
      }
      if (!file.type.startsWith('image/png')) {
        toastError('只支持 PNG 格式图片');
        return;
      }
      
      if (type === 'skin') setSkinFile(file);
      else setCapeFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skinFile && !capeFile) {
        warning('请至少选择一个文件上传');
        return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    if (skinFile) formData.append('skin', skinFile);
    if (capeFile) formData.append('cape', capeFile);

    try {
      await api.post('/api/skin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      success('上传成功！请重新进入服务器查看效果。');
      setSkinFile(null);
      setCapeFile(null);
      // Refresh preview if showing current user
      if (previewUser === user?.username) {
         const currentUser = previewUser;
         setPreviewUser('');
         setTimeout(() => setPreviewUser(currentUser), 100);
      }
    } catch (err: any) {
      toastError(err.response?.data?.error || '上传失败，请确保文件格式正确');
    } finally {
      setIsUploading(false);
    }
  };

  const SkinViewer = ({ username }: { username: string }) => {
     if (!username) return null;
     
     const skinUrl = `https://minotar.net/skin/${username}`;
     const helmUrl = `https://minotar.net/helm/${username}/100.png`;
     const bodyUrl = `https://minotar.net/armor/body/${username}/150.png`;

     return (
         <div className="flex flex-col items-center gap-6">
             <div className="relative group cursor-pointer" onClick={() => window.open(skinUrl, '_blank')}>
                 <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all opacity-50 group-hover:opacity-100"></div>
                 <div className="relative bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center min-h-[200px] min-w-[150px]">
                     {previewType === '3d' ? (
                         <img src={bodyUrl} alt={`${username}'s skin`} className="h-48 w-auto object-contain drop-shadow-lg" />
                     ) : (
                         <img src={helmUrl} alt={`${username}'s helm`} className="h-32 w-32 object-contain drop-shadow-lg rounded-lg" />
                     )}
                 </div>
                 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="p-1.5 bg-black/50 text-white rounded-lg backdrop-blur-sm">
                         <ExternalLink size={14} />
                     </div>
                 </div>
             </div>
             
             <div className="flex gap-2">
                 <button 
                    onClick={() => setPreviewType('3d')}
                    className={clsx(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        previewType === '3d' 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                 >
                     全身预览
                 </button>
                 <button 
                    onClick={() => setPreviewType('2d')}
                    className={clsx(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        previewType === '2d' 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                 >
                     头像预览
                 </button>
             </div>
             
             <div className="flex items-center gap-3">
                 <a 
                    href={`https://minotar.net/download/${username}`} 
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                 >
                     <Download size={16} />
                     下载此皮肤
                 </a>
             </div>
         </div>
     );
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center justify-center p-4 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl mb-4 text-emerald-600 dark:text-emerald-400"
            >
                <Shirt size={40} />
            </motion.div>
            <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-slate-900 dark:text-white mb-4"
            >
                皮肤站
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg"
            >
                自定义您的游戏形象，支持上传皮肤和披风。
                <br className="hidden sm:block" />
                让您在 KukeMC 的世界中与众不同。
            </motion.p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Left Column: Upload */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Upload size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">上传新外观</h2>
                </div>

                {!user ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                             <HelpCircle size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">需要登录</h3>
                        <p className="text-slate-500 mb-6 max-w-xs">请先登录账号，以便我们将皮肤应用到您的角色上。</p>
                        <a href="/login" className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium">
                            去登录
                        </a>
                    </div>
                ) : (
                    <form onSubmit={handleUpload} className="space-y-6">
                        {/* Skin Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                皮肤文件 (Skin)
                            </label>
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    accept="image/png"
                                    onChange={(e) => handleFileChange(e, 'skin')}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={clsx(
                                    "w-full border-2 border-dashed rounded-xl p-6 flex items-center gap-4 transition-all",
                                    skinFile 
                                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" 
                                      : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 group-hover:border-slate-400 dark:group-hover:border-slate-600"
                                )}>
                                    <div className={clsx(
                                        "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                        skinFile ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                                    )}>
                                        {skinFile ? <CheckCircle size={24} /> : <Shirt size={24} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={clsx("font-medium truncate", skinFile ? "text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300")}>
                                            {skinFile ? skinFile.name : "点击选择皮肤文件"}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {skinFile ? `${(skinFile.size / 1024).toFixed(1)} KB` : "支持 64x64 或 64x32 PNG 格式"}
                                        </p>
                                    </div>
                                    {skinFile && (
                                        <button 
                                            type="button" 
                                            onClick={(e) => { e.preventDefault(); setSkinFile(null); }}
                                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full z-20 text-slate-400"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Cape Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                披风文件 (Cape) <span className="text-slate-400 font-normal text-xs ml-2">(可选)</span>
                            </label>
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    accept="image/png"
                                    onChange={(e) => handleFileChange(e, 'cape')}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={clsx(
                                    "w-full border-2 border-dashed rounded-xl p-6 flex items-center gap-4 transition-all",
                                    capeFile 
                                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/10" 
                                      : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 group-hover:border-slate-400 dark:group-hover:border-slate-600"
                                )}>
                                    <div className={clsx(
                                        "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                        capeFile ? "bg-purple-100 text-purple-600" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                                    )}>
                                        {capeFile ? <CheckCircle size={24} /> : <div className="w-6 h-8 border-2 border-current rounded-sm" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={clsx("font-medium truncate", capeFile ? "text-purple-700 dark:text-purple-400" : "text-slate-600 dark:text-slate-300")}>
                                            {capeFile ? capeFile.name : "点击选择披风文件"}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {capeFile ? `${(capeFile.size / 1024).toFixed(1)} KB` : "支持标准披风 PNG 格式"}
                                        </p>
                                    </div>
                                    {capeFile && (
                                        <button 
                                            type="button" 
                                            onClick={(e) => { e.preventDefault(); setCapeFile(null); }}
                                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full z-20 text-slate-400"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Notice */}
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 flex gap-3">
                            <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-700 dark:text-amber-400/90">
                                <p className="font-bold mb-1">注意事项</p>
                                <ul className="list-disc list-inside space-y-1 opacity-90">
                                    <li>上传后可能需要 1-5 分钟缓存刷新</li>
                                    <li>游戏内请使用 <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">/skin update</code> 刷新</li>
                                    <li>严禁上传色情、暴力等违规皮肤</li>
                                </ul>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isUploading || (!skinFile && !capeFile)}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    正在上传...
                                </>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    确认上传
                                </>
                            )}
                        </button>
                    </form>
                )}
            </motion.div>

            {/* Right Column: Preview */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl flex flex-col"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                        <Shirt size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">皮肤预览</h2>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-full max-w-sm mb-6">
                        <div className="relative">
                             <input
                                type="text"
                                value={previewUser}
                                onChange={(e) => setPreviewUser(e.target.value)}
                                placeholder="输入玩家ID查看皮肤..."
                                className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                             />
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                 <HelpCircle size={18} />
                             </div>
                             {previewUser && (
                                <button 
                                   onClick={() => setPreviewUser('')}
                                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                             )}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {previewUser ? (
                            <motion.div
                                key={previewUser}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="w-full"
                            >
                                <SkinViewer username={previewUser} />
                            </motion.div>
                        ) : (
                            <div className="text-center text-slate-400 py-12">
                                <Shirt size={64} className="mx-auto mb-4 opacity-20" />
                                <p>输入玩家ID查看皮肤预览</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

        </div>
      </div>
    </div>
  );
};

export default SkinClient;
