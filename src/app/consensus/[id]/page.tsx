import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProposalDetailClient from '@/components/next/ProposalDetailClient';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

async function getProposal(id: string) {
  try {
    const res = await fetch(`https://api.kuke.ink/api/consensus/proposals/${id}`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch proposal');
    }
    
    return res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const proposal = await getProposal(params.id);
  
  if (!proposal) {
    return {
      title: '提案不存在 - KukeMC',
    };
  }

  return {
    title: `${proposal.title} - 玩家众议`,
    description: proposal.content ? proposal.content.substring(0, 160) : 'KukeMC 玩家众议提案',
  };
}

export async function generateStaticParams() {
  return [];
}

export default async function ProposalPage({ params }: { params: { id: string } }) {
  const proposal = await getProposal(params.id);

  if (!proposal) {
    notFound();
  }

  // We pass ID to client component to re-fetch and handle interactions
  // Or we could pass initial data. But let's stick to client fetch for consistency with original
  // actually passing initialId is safer as client component fetches fresh data with auth
  return <ProposalDetailClient initialId={Number(params.id)} />;
}
