'use client';

import { useRef } from 'react';
import { Cafe } from '@/types/cafe';
import Hero from './Hero';
import MapSection from './MapSection';

interface MapSectionWrapperProps {
  cafes: Cafe[];
}

export default function MapSectionWrapper({ cafes }: MapSectionWrapperProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  const scrollToMap = () => {
    mapRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Hero onScrollToMap={scrollToMap} />
      <div ref={mapRef}>
        <MapSection cafes={cafes} />
      </div>
    </>
  );
}
