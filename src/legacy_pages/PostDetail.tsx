import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowLeft, MessageSquare, Send, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrentUserLevel } from '../hooks/useCurrentUserLevel';
import SEO from '../components/SEO';
import { Post, Comment } from '../types/activity';
import PostCard from '../components/PostCard';
import CommentSection from '../components/CommentSection';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useToast } from '../context/ToastContext';
import { getAlbum, createAlbumComment } from '../services/album';

const stripMarkdown = (markdown: string) => {
  if (!markdown) return "";
  return markdown
    .replace(/[#*`~>]/g, '') // Remove basic markdown chars
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim()
    .substring(0, 160); // Limit to 160 chars
};

const PostDetail = ({ isAlbumRoute }: { isAlbumRoute?: boolean }) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isAlbum = isAlbumRoute || searchParams.get('type') === 'album';
  const { user, token, loading: authLoading } = useAuth();
  const { level: currentUserLevel } = useCurrentUserLevel();
  const { warning, error: toastError } = useToast();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (id) {
      fetchPostAndComments(id);
    }
  }, [id, token, authLoading, isAlbum]);

  const fetchPostAndComments = async (postId: string) => {
    setLoading(true);
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      let fetchedPost: Post;
      let rawComments: Comment[] = [];

      if (isAlbum) {
        const albumData = await getAlbum(Number(postId));
        
        // Handle potential nested author/user object or flat structure
        const authorInfo = albumData.author || albumData.user || albumData;
        const authorName = authorInfo.username || 'kukemc'; // Fallback

        // Map Album to Post
        fetchedPost = {
            id: albumData.id,
            type: 'album',
            title: albumData.title,
            content: albumData.description || '',
            author: {
                username: authorName,
                nickname: authorInfo.nickname || authorName,
                avatar: authorInfo.avatar,
                custom_title: authorInfo.custom_title
            },
            created_at: albumData.created_at,
            likes_count: albumData.likes,
            comments_count: albumData.comment_count || (albumData.comments?.length || 0),
            collects_count: 0, // Album interface might not have this yet
            is_liked: albumData.is_liked,
            is_collected: albumData.is_collected || false,
            images: [albumData.image_url], // Main image
            tags: []
        };

        const albumComments = Array.isArray(albumData.comments) ? albumData.comments : [];
        rawComments = albumComments.map((c: any) => {
            const commentAuthor = c.author || c.user || c;
            return {
                id: c.id,
                post_id: Number(postId),
                content: c.content,
                created_at: c.created_at,
                author: {
                    username: commentAuthor.username || 'User',
                    nickname: commentAuthor.nickname || commentAuthor.username || 'User',
                    custom_title: commentAuthor.custom_title,
                    avatar: commentAuthor.avatar
                },
                replies: []
            };
        });

      } else {
        const [postRes, commentsRes] = await Promise.all([
            api.get<Post>(`/api/posts/${postId}`, config),
            api.get<Comment[]>(`/api/posts/${postId}/comments`, config)
        ]);
        fetchedPost = postRes.data;
        const responseData = commentsRes.data as any;
        rawComments = (Array.isArray(responseData) ? responseData : (responseData.data || [])) as Comment[];
      }

      setPost(fetchedPost);
      
      const commentMap = new Map<number, Comment>();
      const rootComments: Comment[] = [];

      rawComments.forEach(c => {
        commentMap.set(c.id, { ...c, replies: [] });
      });

      rawComments.forEach(c => {
        const processedComment = commentMap.get(c.id)!;
        if (c.parent_id) {
          const parent = commentMap.get(c.parent_id);
          if (parent) {
            parent.replies?.push(processedComment);
          } else {
            rootComments.push(processedComment);
          }
        } else {
          rootComments.push(processedComment);
        }
      });

      // Sort by time
      rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setComments(rootComments);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || '加载失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCommentSubmit = async (content: string, parentId?: number) => {
    if (!post) return;

    if (currentUserLevel !== null && currentUserLevel < 5) {
        warning('您的等级不足 5 级，无法评论。请前往游戏内升级！');
        return;
    }

    try {
      if (isAlbum) {
         await createAlbumComment(post.id, content);
         await fetchPostAndComments(post.id.toString());
      } else {
         await api.post(`/api/posts/${post.id}/comments`, {
            content: content,
            parent_id: parentId
         }, {
            headers: { Authorization: `Bearer ${token}` }
         });
         await fetchPostAndComments(post.id.toString());
      }
    } catch (err: any) {
      toastError(err.response?.data?.detail || '评论失败');
      throw err;
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    
    try {
      if (isAlbum) {
         await api.delete(`/api/album/comment/${commentId}`, { headers: { Authorization: `Bearer ${token}` } });
      } else {
         await api.delete(`/api/posts/comments/${commentId}`, { headers: { Authorization: `Bearer ${token}` } });
      }
      // Refresh comments
      await fetchPostAndComments(post!.id.toString());
    } catch (err: any) {
      console.error(err);
      toastError(err.response?.data?.detail || '删除失败');
    }
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPost(updatedPost);
  };

  const handlePostDelete = () => {
    navigate('/activity');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">无法加载动态</h2>
          <p className="text-slate-500 mb-6">{error || '动态不存在或已被删除'}</p>
          <Link to="/activity" className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
            返回广场
          </Link>
        </div>
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": post.type === 'album' ? "ImageGallery" : "BlogPosting",
    "headline": post.title,
    "image": post.images || [],
    "author": {
      "@type": "Person",
      "name": post.author.nickname || post.author.username
    },
    "publisher": {
      "@type": "Organization",
      "name": "KukeMC",
      "logo": {
        "@type": "ImageObject",
        "url": "https://kuke.ink/logo.webp"
      }
    },
    "datePublished": post.created_at,
    "dateModified": post.updated_at || post.created_at,
    "description": stripMarkdown(post.content).substring(0, 160),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": post.type === 'album' ? `https://kuke.ink/album/${post.id}` : `https://kuke.ink/activity/${post.id}`
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="relative z-10">
        {post ? (
          <SEO 
            title={`${post.title} - ${post.type === 'album' ? '相册详情' : '动态详情'}`}
            description={stripMarkdown(post.content)}
            image={post.images && post.images.length > 0 ? post.images[0] : undefined}
            author={post.author.nickname || post.author.username}
            publishedTime={post.created_at}
            modifiedTime={post.updated_at}
            type="article"
            url={post.type === 'album' ? `/album/${post.id}` : `/activity/${post.id}`}
            keywords={post.tags}
            structuredData={structuredData}
          />
        ) : (
          <SEO title="动态详情 - KukeMC" />
        )}
        <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>

        <div className="space-y-6">
          {/* 使用 PostCard 展示动态详情，但可以稍微定制样式如果需要 */}
          <PostCard 
            post={post} 
            onUpdate={handlePostUpdate} 
            onDelete={handlePostDelete}
            className="!cursor-default hover:!shadow-sm" // 覆盖 PostCard 的交互样式
            isDetail={true} // 开启详情模式
          />

          {/* Comments Section */}
          <CommentSection 
            comments={comments}
            currentUser={user}
            onSubmit={handleCommentSubmit}
            onDelete={handleCommentDelete}
            loading={loading}
            title="全部评论"
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
          />
        </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
