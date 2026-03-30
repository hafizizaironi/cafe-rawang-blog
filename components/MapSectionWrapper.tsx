'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { Cafe } from '@/types/cafe';
import Hero from './Hero';
import MapSection from './MapSection';

interface MapSectionWrapperProps {
  cafes: Cafe[];
}

export default function MapSectionWrapper({ cafes }: MapSectionWrapperProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const scrollToMap = () => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      mapRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const overlay = overlayRef.current;
    if (!overlay) return;

    // Fade overlay in → instant-scroll to map → fade overlay out
    gsap.timeline()
      .set(overlay, { display: 'block' })
      .fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.55, ease: 'power2.inOut' })
      .add(() => {
        mapRef.current?.scrollIntoView({ behavior: 'instant' } as ScrollIntoViewOptions);
      })
      .to(overlay, { opacity: 0, duration: 0.55, ease: 'power2.inOut' })
      .set(overlay, { display: 'none' });
  };

  return (
    <>
      {/* Full-screen dissolve overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 pointer-events-none hidden"
        style={{ background: '#3b2110' }}
      />

      <Hero onScrollToMap={scrollToMap} />
      <div ref={mapRef}>
        <MapSection cafes={cafes} />
      </div>
    </>
  );
}
