import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, AlertCircle, Calendar, User, ArrowLeft, MessageSquare, ThumbsUp, Heart, Smile, PartyPopper, Rocket, Eye } from 'lucide-react';
import api from '../utils/api';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import CommentSection, { UIComment } from '../components/CommentSection';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  reactions: Record<string, number>;
  comments_count: number;
  user_selected_reactions: string[];
  reaction_users: Record<string, string[]>;
}


const REACTION_EMOJIS: Record<string, string> = {
  thumbs_up: '👍',
  thumbs_down: '👎',
  laugh: '😄',
  hooray: '🎉',
  confused: '😕',
  heart: '❤️',
  rocket: '🚀',
  eyes: '👀'
};

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Assuming AuthContext provides user
  const { showToast } = useToast();

  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  
  const [comments, setComments] = useState<UIComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);

  useEffect(() => {
    if (!id) return;

    // Fetch News Detail
    api.get<NewsItem>(`/api/website/news/${id}`)
      .then(res => {
        setNews(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('无法加载公告内容');
        setLoading(false);
      });

    // Fetch Comments
    fetchComments();
  }, [id]);

  const fetchComments = () => {
    if (!id) return;
    api.get<any[]>(`/api/website/news/${id}/comments`)
      .then(res => {
        const rawComments = res.data;
        const commentMap = new Map<number, UIComment>();
        const rootComments: UIComment[] = [];

        rawComments.forEach(c => {
            commentMap.set(c.id, {
                id: c.id,
                content: c.content,
                created_at: c.created_at,
                parent_id: c.parent_id,
                author: {
                    username: c.author_name,
                    nickname: c.author_name,
                    avatar: `https://cravatar.eu/helmavatar/${c.author_name}/100.png`
                },
                replies: []
            });
        });

        rawComments.forEach(c => {
            const processed = commentMap.get(c.id)!;
            if (c.parent_id) {
                const parent = commentMap.get(c.parent_id);
                if (parent) {
                    parent.replies?.push(processed);
                } else {
                    rootComments.push(processed);
                }
            } else {
                rootComments.push(processed);
            }
        });
        
        rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setComments(rootComments);
        setCommentsLoading(false);
      })
      .catch(err => console.error(err));
  };

  const handleReaction = async (type: string, e?: React.MouseEvent) => {
    if (!news) return;

    // Trigger animation immediately for better UX
    if (e) {
      const id = Date.now();
      setFloatingEmojis(prev => [...prev, { id, emoji: REACTION_EMOJIS[type], x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(item => item.id !== id));
      }, 1000);
    }

    try {
      await api.post(`/api/website/news/${news.id}/reaction`, { 
        reaction_type: type,
        reactor_identifier: user?.username // Send username if logged in
      });
      // Refresh news to get updated reactions
      const res = await api.get<NewsItem>(`/api/website/news/${news.id}`);
      setNews(res.data);
    } catch (error) {
      console.error(error);
      showToast('操作失败', 'error');
    }
  };

  const handleCommentSubmit = async (content: string, parentId?: number) => {
    if (!news) return;

    if (!user) {
        showToast('请先登录后再评论', 'error');
        navigate('/login');
        return;
    }

    try {
      await api.post(`/api/website/news/${news.id}/comments`, {
        author_name: user.username || 'Anonymous',
        content: content,
        parent_id: parentId
      });
      showToast('评论发表成功', 'success');
      fetchComments();
    } catch (error) {
      console.error(error);
      showToast('评论发表失败', 'error');
      throw error;
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!news) return;
    if (!confirm('确定要删除这条评论吗？')) return;
    
    try {
      await api.delete(`/api/website/news/${news.id}/comments/${commentId}`);
      showToast('删除成功', 'success');
      fetchComments();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || '删除失败', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center text-red-400">
        <AlertCircle size={40} className="mb-4 opacity-50" />
        <p>{error || '公告不存在'}</p>
        <button onClick={() => navigate('/news')} className="mt-4 text-emerald-500 hover:underline">
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <SEO title={`${news.title} - KukeMC`} description={news.content.substring(0, 100)} url={`/news/${news.id}`} />
      
      <div className="max-w-4xl mx-auto">
        <AnimatePresence>
          {floatingEmojis.map(anim => (
            <motion.div
              key={anim.id}
              initial={{ opacity: 1, y: 0, scale: 0.5 }}
              animate={{ opacity: 0, y: -100, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ 
                position: 'fixed', 
                left: anim.x, 
                top: anim.y, 
                pointerEvents: 'none', 
                zIndex: 9999, 
                fontSize: '2rem',
                transform: 'translate(-50%, -50%)'
              }}
            >
              {anim.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        <button 
          onClick={() => navigate('/news')}
          className="flex items-center text-slate-500 hover:text-emerald-500 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          返回列表
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 rounded-2xl relative mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            {news.title}
          </h1>
          
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-8 pb-4 border-b border-slate-200 dark:border-white/10">
            <Calendar size={16} className="mr-2" />
            <span className="mr-6">{new Date(news.created_at).toLocaleDateString()}</span>
            <User size={16} className="mr-2" />
            <span>{news.author}</span>
          </div>

          <div className="prose prose-slate dark:prose-invert prose-emerald max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({node, ...props}) => <a {...props} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors" target="_blank" rel="noopener noreferrer" />,
                img: ({node, ...props}) => <img {...props} className="rounded-xl shadow-lg my-6" />,
                code: ({node, inline, className, children, ...props}: any) => {
                  return !inline ? (
                    <pre className="bg-slate-100 dark:bg-slate-950/50 p-4 rounded-lg overflow-x-auto border border-slate-200 dark:border-white/10 my-4">
                      <code className={className} {...props}>{children}</code>
                    </pre>
                  ) : (
                    <code className="bg-slate-100 dark:bg-slate-800/50 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-300 text-sm font-mono" {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {news.content}
            </ReactMarkdown>
          </div>

          {/* Reactions */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowPicker(!showPicker)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                  title="Add reaction"
                >
                  <Smile size={18} />
                </button>
                
                <AnimatePresence>
                  {showPicker && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowPicker(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute bottom-full left-0 mb-2 z-20 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 p-1 flex items-center gap-1 min-w-max"
                      >
                        {Object.entries(REACTION_EMOJIS).map(([key, emoji]) => {
                          const isSelected = news.user_selected_reactions?.includes(key);
                          return (
                            <button
                              key={key}
                              onClick={(e) => {
                                handleReaction(key, e);
                                setShowPicker(false);
                              }}
                              className={clsx(
                                "w-9 h-9 flex items-center justify-center text-lg rounded-full transition-all hover:scale-110 active:scale-95",
                                isSelected ? "bg-emerald-100 dark:bg-emerald-900/30" : "hover:bg-slate-100 dark:hover:bg-slate-700"
                              )}
                              title={key}
                            >
                              {emoji}
                            </button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Existing Reactions */}
              {Object.entries(news.reactions).map(([key, count]) => {
                if (count <= 0) return null;
                const isSelected = news.user_selected_reactions?.includes(key);
                const users = news.reaction_users?.[key] || [];
                
                // Construct tooltip text
                let tooltipText = "";
                if (users.length > 0) {
                  const uniqueUsers = Array.from(new Set(users));
                  const displayLimit = 5;
                  const displayUsers = uniqueUsers.slice(0, displayLimit);
                  const remaining = uniqueUsers.length - displayLimit;
                  
                  tooltipText = displayUsers.join(", ");
                  if (remaining > 0) {
                    tooltipText += ` 等 ${remaining} 人`;
                  }
                  tooltipText += ` 点了 ${REACTION_EMOJIS[key]}`;
                }

                return (
                  <div key={key} className="relative group/tooltip">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleReaction(key, e)}
                      className={clsx(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 border",
                        isSelected 
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                          : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <span>{REACTION_EMOJIS[key]}</span>
                      <span>{count}</span>
                    </motion.button>
                    
                    {/* Tooltip */}
                    {tooltipText && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-slate-800 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                        {tooltipText}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Comments Section */}
        <CommentSection 
            comments={comments}
            currentUser={user}
            onSubmit={handleCommentSubmit}
            onDelete={handleCommentDelete}
            loading={commentsLoading}
            title="评论"
            className="glass-panel p-8 rounded-2xl relative overflow-hidden"
        />
      </div>
    </div>
  );
};

export default NewsDetail;
