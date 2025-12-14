import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostDetailClient from '@/components/next/PostDetailClient';
import { Post } from '@/types/activity';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

async function getAlbum(id: string): Promise<Post | null> {
  try {
    const res = await fetch(`https://api.kuke.ink/api/album/${id}`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch album');
    }
    
    const albumData = await res.json();
    
    // Map Album to Post
    const authorInfo = albumData.author || albumData.user || albumData;
    const authorName = authorInfo.username || 'kukemc'; 

    return {
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
        collects_count: 0,
        is_liked: albumData.is_liked,
        is_collected: albumData.is_collected || false,
        images: [albumData.image_url], // Main image
        tags: []
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await getAlbum(params.id);
  
  if (!post) {
    return {
      title: '相册不存在 - KukeMC',
    };
  }

  const description = post.content 
    ? post.content.replace(/[#*`~>]/g, '').substring(0, 160) 
    : 'KukeMC 玩家相册';

  return {
    title: `${post.title} - KukeMC 相册`,
    description: description,
    openGraph: {
        title: post.title,
        description: description,
        type: 'article',
        publishedTime: post.created_at,
        authors: [post.author.nickname || post.author.username],
        images: post.images && post.images.length > 0 ? [post.images[0]] : [],
    }
  };
}

export async function generateStaticParams() {
  // Return empty to generate on demand
  return [];
}

export default async function AlbumPage({ params }: { params: { id: string } }) {
  const post = await getAlbum(params.id);

  if (!post) {
    notFound();
  }

  return <PostDetailClient initialPost={post} isAlbum={true} />;
}
