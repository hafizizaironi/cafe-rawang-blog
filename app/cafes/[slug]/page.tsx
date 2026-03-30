import { notFound } from 'next/navigation';
import cafesData from '@/data/cafes.json';
import { Cafe } from '@/types/cafe';
import CafeDetailClient from '@/components/CafeDetailClient';

const cafes = cafesData as Cafe[];

export function generateStaticParams() {
  return cafes.map((cafe) => ({ slug: cafe.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const cafe = cafes.find((c) => c.slug === params.slug);
  if (!cafe) return {};
  return {
    title: `${cafe.name} — Cafes Around Rawang`,
    description: cafe.tagline,
  };
}

export default function CafePage({ params }: { params: { slug: string } }) {
  const cafe = cafes.find((c) => c.slug === params.slug);
  if (!cafe) notFound();

  return <CafeDetailClient cafe={cafe} />;
}
