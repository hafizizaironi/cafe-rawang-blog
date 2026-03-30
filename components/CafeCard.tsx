'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Cafe } from '@/types/cafe';

const PLACEHOLDER_GRADIENTS = [
  'linear-gradient(135deg, #2d1a0e 0%, #7a8c5e 100%)',
  'linear-gradient(135deg, #1a0f07 0%, #c4622d 100%)',
  'linear-gradient(135deg, #7a8c5e 0%, #2d1a0e 100%)',
];

interface CafeCardProps {
  cafe: Cafe;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export default function CafeCard({ cafe, index, isActive, onClick }: CafeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.15 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const gradient = PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length];

  return (
    <div
      ref={cardRef}
      className="opacity-0 translate-y-8 transition-all duration-700 ease-out"
      style={{ transitionDelay: `${index * 80}ms` }}
      onClick={onClick}
    >
      <div
        className={`group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
          isActive
            ? 'border-terracotta shadow-xl shadow-terracotta/20 scale-[1.01]'
            : 'border-transparent hover:border-terracotta/40 hover:shadow-lg'
        } bg-cream`}
      >
        {/* Photo */}
        <div
          className="w-full h-44 relative overflow-hidden"
          style={{ background: gradient }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">
            ☕
          </div>
          {isActive && (
            <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-terracotta animate-ping" />
          )}
          {/* Tag overlay */}
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {cafe.vibeTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-espresso/70 text-cream backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className="text-olive text-xs font-medium uppercase tracking-widest">
                {cafe.neighborhood}
              </span>
              <h3 className="font-display text-xl font-bold text-espresso leading-tight mt-0.5">
                {cafe.name}
              </h3>
            </div>
          </div>

          <p className="text-espresso/60 text-sm leading-relaxed mb-3">{cafe.tagline}</p>

          <div className="flex items-center gap-2 text-espresso/50 text-xs mb-4">
            <span>🕐</span>
            <span>{cafe.hours}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {cafe.vibeTags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-cream-dark text-espresso/70 border border-cream-dark"
              >
                {tag}
              </span>
            ))}
          </div>

          <Link
            href={`/cafes/${cafe.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-terracotta text-sm font-semibold hover:gap-2.5 transition-all duration-200"
          >
            Read full story <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
