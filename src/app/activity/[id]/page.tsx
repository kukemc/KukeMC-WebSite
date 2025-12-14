import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostDetailClient from '@/components/next/PostDetailClient';
import { Post } from '@/types/activity';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

async function getPost(id: string): Promise<Post | null> {
  try {
    const res = await fetch(`https://api.kuke.ink/api/posts/${id}`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch post');
    }
    
    const data = await res.json();
    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await getPost(params.id);
  
  if (!post) {
    return {
      title: '动态不存在 - KukeMC',
    };
  }

  const description = post.content 
    ? post.content.replace(/[#*`~>]/g, '').substring(0, 160) 
    : 'KukeMC 玩家动态';

  return {
    title: `${post.title} - KukeMC`,
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

export default async function ActivityPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);

  if (!post) {
    notFound();
  }

  return <PostDetailClient initialPost={post} isAlbum={false} />;
}
