import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import NewsDetailClient from '@/components/next/NewsDetailClient';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

async function getNews(id: string) {
  // Use absolute URL for server-side fetch
  try {
    const res = await fetch(`https://api.kuke.ink/api/website/news/${id}`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch news');
    }
    
    return res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const news = await getNews(params.id);
  
  if (!news) {
    return {
      title: '公告不存在 - KukeMC',
    };
  }

  return {
    title: `${news.title} - KukeMC`,
    description: news.content ? news.content.substring(0, 160).replace(/[#*`]/g, '') : 'KukeMC 服务器公告',
    openGraph: {
        title: news.title,
        description: news.content ? news.content.substring(0, 160) : 'KukeMC 服务器公告',
        type: 'article',
        publishedTime: news.created_at,
        authors: [news.author],
    }
  };
}

export async function generateStaticParams() {
  // Optional: Pre-render some latest news
  // For now, we return empty array to generate on demand
  return [];
}

export default async function NewsPage({ params }: { params: { id: string } }) {
  const news = await getNews(params.id);

  if (!news) {
    notFound();
  }

  return <NewsDetailClient initialNews={news} />;
}
