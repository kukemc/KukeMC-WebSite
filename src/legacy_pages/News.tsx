import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, AlertCircle, Megaphone, Calendar, User, ArrowLeft, ChevronRight, History, Tag, GitCommit } from 'lucide-react';
import api from '../utils/api';
import clsx from 'clsx';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
}

interface ChangelogItem {
  id: number;
  version: string;
  content: string[];
  created_at: string;
  is_published: boolean;
}

const News = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'news' | 'changelog'>(
    location.pathname === '/changelog' ? 'changelog' : 'news'
  );
  
  // Effect to sync tab with URL if URL changes externally (e.g. browser back button)
  useEffect(() => {
    if (location.pathname === '/changelog') {
      setActiveTab('changelog');
    } else if (location.pathname === '/news') {
      setActiveTab('news');
    }
  }, [location.pathname]);
  
  // News State
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Changelog State
  const [logs, setLogs] = useState<ChangelogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch News
    api.get<NewsItem[]>('/api/website/news/')
      .then(res => {
        setNewsList(res.data);
        setNewsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setNewsError('无法加载公告内容');
        setNewsLoading(false);
      });

    // Fetch Changelog
    api.get<ChangelogItem[]>('/api/website/changelog/')
      .then(res => {
        setLogs(res.data);
        setLogsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLogsError('无法加载更新日志');
        setLogsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <SEO title="资讯中心 - KukeMC" description="了解服务器最新动态、活动信息与开发进程" url="/news" />
      <div className="max-w-4xl mx-auto">
        {/* Header & Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 transition-colors duration-300">
            资讯<span className="text-gradient">中心</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg transition-colors duration-300 mb-8">
            了解服务器最新动态、活动信息与开发进程
          </p>

          <div className="flex justify-center">
            <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl inline-flex relative">
              {[
                { id: 'news', label: '游戏公告', icon: Megaphone },
                { id: 'changelog', label: '更新日志', icon: History }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as 'news' | 'changelog');
                    navigate(tab.id === 'news' ? '/news' : '/changelog');
                  }}
                  className={clsx(
                    'relative px-6 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 z-10',
                    activeTab === tab.id 
                      ? 'text-slate-900 dark:text-white' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  )}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white dark:bg-slate-700 shadow-sm rounded-lg -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'news' ? (
            <motion.div
              key="news-panel"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {newsLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <Loader2 size={40} className="animate-spin mb-4 text-emerald-500" />
                  <p>正在获取最新公告...</p>
                </div>
              ) : newsError ? (
                <div className="flex flex-col items-center justify-center h-64 text-red-400">
                  <AlertCircle size={40} className="mb-4 opacity-50" />
                  <p>{newsError}</p>
                </div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                   {newsList.length === 0 ? (
                      <div className="text-center text-slate-500 py-12">
                        暂无公告
                      </div>
                   ) : (
                     newsList.map((news, index) => (
                      <motion.div
                        key={news.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          navigate(`/news/${news.id}`);
                        }}
                        className="glass-panel p-6 rounded-2xl relative overflow-hidden cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-300 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                                <Megaphone size={20} className="text-emerald-500" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                                  {news.title}
                                </h2>
                             </div>
                             <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm pl-8">
                                <Calendar size={14} className="mr-2" />
                                <span className="mr-4">{new Date(news.created_at).toLocaleDateString()}</span>
                                <User size={14} className="mr-2" />
                                <span>{news.author}</span>
                             </div>
                          </div>
                          <ChevronRight className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        </div>
                      </motion.div>
                     ))
                   )}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="changelog-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
               {logsLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <Loader2 size={40} className="animate-spin mb-4 text-emerald-500" />
                  <p>正在获取最新更新日志...</p>
                </div>
              ) : logsError ? (
                <div className="flex flex-col items-center justify-center h-64 text-red-400">
                  <AlertCircle size={40} className="mb-4 opacity-50" />
                  <p>{logsError}</p>
                </div>
              ) : (
                <div className="space-y-8 relative before:absolute before:left-[27px] before:top-6 before:bottom-6 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {logs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative pl-16"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute left-0 top-6 w-14 flex justify-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 dark:ring-emerald-500/10" />
                      </div>

                      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden transition-colors duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-200 dark:border-white/10 pb-4">
                          <div className="flex items-center gap-3 mb-2 sm:mb-0">
                            <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                              <Tag size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                              {log.version}
                            </h2>
                          </div>
                          <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
                            <Calendar size={16} className="mr-2" />
                            {new Date(log.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <ul className="space-y-3">
                          {Array.isArray(log.content) ? (
                            log.content.map((item, i) => (
                              <li key={i} className="flex items-start text-slate-700 dark:text-slate-300 group">
                                <GitCommit size={18} className="mr-3 mt-1 text-emerald-500 shrink-0 group-hover:text-emerald-400 transition-colors" />
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-700 dark:text-slate-300">
                              {String(log.content)}
                            </li>
                          )}
                        </ul>
                      </div>
                    </motion.div>
                  ))}
                  
                  {logs.length === 0 && (
                     <div className="text-center text-slate-500 py-12 pl-16">
                       暂无更新日志
                     </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default News;
