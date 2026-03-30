'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Cafe } from '@/types/cafe';
import CafeCard from './CafeCard';

const CafeMap = dynamic(() => import('./CafeMap'), { ssr: false });

interface MapSectionProps {
  cafes: Cafe[];
}

export default function MapSection({ cafes, }: MapSectionProps) {
  const [activeCafeId, setActiveCafeId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback(() => {
    if (!listRef.current) return;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      const container = listRef.current!;
      const containerRect = container.getBoundingClientRect();
      const containerMid = containerRect.top + containerRect.height / 2;

      let closestCafe: Cafe | null = null;
      let closestDist = Infinity;

      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cardMid = rect.top + rect.height / 2;
        const dist = Math.abs(cardMid - containerMid);
        if (dist < closestDist) {
          closestDist = dist;
          closestCafe = cafes[i];
        }
      });

      if (closestCafe) setActiveCafeId((closestCafe as Cafe).id);
    }, 80);
  }, [cafes]);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (cafes.length > 0) setActiveCafeId(cafes[0].id);
  }, [cafes]);

  return (
    <section id="map-section" className="bg-cream py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="mb-10 text-center">
          <span className="text-terracotta text-xs font-medium uppercase tracking-widest">
            Explore
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-espresso mt-2">
            Find Your Next Favourite
          </h2>
          <p className="text-espresso/50 mt-3 text-base max-w-md mx-auto">
            Cafes hand-picked around Rawang &amp; Bukit Sentosa. Click a pin or scroll through the list.
          </p>
        </div>

        {/* Layout: map sticky on left, cards on right (desktop) */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Map — sticky on desktop, full-width on mobile */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-6 self-start">
            <div className="h-[380px] md:h-[520px] lg:h-[620px] w-full rounded-2xl overflow-hidden shadow-2xl">
              <CafeMap cafes={cafes} activeCafeId={activeCafeId} />
            </div>
          </div>

          {/* Card list — scrollable */}
          <div
            ref={listRef}
            className="w-full lg:w-1/2 flex flex-col gap-5 lg:max-h-[620px] lg:overflow-y-auto pr-1"
          >
            {cafes.map((cafe, i) => (
              <div
                key={cafe.id}
                ref={(el) => { cardRefs.current[i] = el; }}
              >
                <CafeCard
                  cafe={cafe}
                  index={i}
                  isActive={activeCafeId === cafe.id}
                  onClick={() => setActiveCafeId(cafe.id)}
                />
              </div>
            ))}
            {/* Bottom padding so last card can reach center */}
            <div className="h-24 flex-shrink-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
