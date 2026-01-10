import { Suspense } from 'react';
import { Metadata } from 'next';
import FormDetailClient from '@/components/next/forms/FormDetailClient';

export const metadata: Metadata = {
  title: '填写问卷 - KukeMC',
};

export default function FormDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>}>
      <FormDetailClient id={params.id} />
    </Suspense>
  );
}
