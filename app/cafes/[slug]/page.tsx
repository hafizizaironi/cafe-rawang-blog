'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Cafe } from '@/types/cafe';
import CafeDetailClient from '@/components/CafeDetailClient';
import { getPlaceBySlug } from '@/lib/firestore';

export default function CafePage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : Array.isArray(params.slug) ? params.slug[0] : '';

  const [cafe, setCafe] = useState<Cafe | null | 'loading'>('loading');

  useEffect(() => {
    if (!slug) { setCafe(null); return; }
    getPlaceBySlug(slug).then(setCafe).catch(() => setCafe(null));
  }, [slug]);

  if (cafe === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-espresso">
        <span className="text-5xl animate-pulse">☕</span>
      </div>
    );
  }

  if (!cafe) return notFound();

  return <CafeDetailClient cafe={cafe} />;
}
