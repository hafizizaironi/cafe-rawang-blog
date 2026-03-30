'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Cafe } from '@/types/cafe';
import Link from 'next/link';
import { gsap } from 'gsap';

interface CafeMapProps {
  cafes: Cafe[];
  activeCafeId?: string | null;
}

function createCoffeeIcon(isActive = false) {
  const color = isActive ? '#c4622d' : '#2d1a0e';
  const borderColor = isActive ? '#f5efe6' : '#c4622d';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="40" height="48">
      <circle cx="20" cy="18" r="16" fill="${color}" stroke="${borderColor}" stroke-width="2.5"/>
      <text x="20" y="24" text-anchor="middle" font-size="14" fill="#f5efe6">☕</text>
      <polygon points="12,34 28,34 20,46" fill="${color}"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [40, 48],
    iconAnchor: [20, 46],
    popupAnchor: [0, -48],
  });
}

function MapFlyTo({ lat, lng, active }: { lat: number; lng: number; active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (active) {
      map.flyTo([lat, lng], 16, { duration: 1.2 });
    }
  }, [lat, lng, active, map]);
  return null;
}

interface SidebarProps {
  cafe: Cafe | null;
  onClose: () => void;
}

function Sidebar({ cafe, onClose }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (cafe && sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current,
        { x: '100%', opacity: 0 },
        { x: '0%', opacity: 1, duration: prefersReduced ? 0 : 0.4, ease: 'power3.out' }
      );
    }
  }, [cafe]);

  if (!cafe) return null;

  return (
    <div
      ref={sidebarRef}
      className="absolute top-0 right-0 h-full w-72 bg-espresso text-cream z-[1000] shadow-2xl flex flex-col overflow-hidden"
      style={{ transform: 'translateX(100%)' }}
    >
      {/* Cafe photo placeholder */}
      <div className="relative w-full h-44 bg-espresso-light flex-shrink-0 overflow-hidden">
        <div
          className="w-full h-full flex items-center justify-center text-5xl"
          style={{ background: 'linear-gradient(135deg, #2d1a0e 0%, #7a8c5e 100%)' }}
        >
          ☕
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-cream/20 hover:bg-cream/40 text-cream flex items-center justify-center transition-colors text-lg font-bold"
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1 overflow-y-auto">
        <span className="text-terracotta text-xs font-medium uppercase tracking-widest mb-1">
          {cafe.neighborhood}
        </span>
        <h3 className="font-display text-xl font-bold text-cream mb-2 leading-tight">
          {cafe.name}
        </h3>
        <p className="text-cream/70 text-sm leading-relaxed mb-3">{cafe.tagline}</p>
        <div className="flex items-center gap-2 text-cream/60 text-xs mb-4">
          <span>🕐</span>
          <span>{cafe.hours}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {cafe.vibeTags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-xs font-medium border border-terracotta/50 text-terracotta"
            >
              {tag}
            </span>
          ))}
        </div>
        <Link
          href={`/cafes/${cafe.slug}`}
          className="mt-auto block text-center py-3 px-4 bg-terracotta text-cream rounded-lg text-sm font-semibold hover:bg-terracotta/80 transition-colors"
        >
          Read more →
        </Link>
      </div>
    </div>
  );
}

export default function CafeMap({ cafes, activeCafeId }: CafeMapProps) {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const markers = Object.values(markersRef.current);
    markers.forEach((marker, i) => {
      const el = marker.getElement();
      if (el) {
        gsap.fromTo(
          el,
          { scale: 0, opacity: 0, transformOrigin: 'bottom center' },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            delay: i * 0.2,
            ease: 'back.out(1.7)',
          }
        );
      }
    });
  }, []);

  const activeCafe = activeCafeId ? cafes.find((c) => c.id === activeCafeId) : null;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl shadow-xl">
      <MapContainer
        center={[3.38, 101.56]}
        zoom={14}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {activeCafe && (
          <MapFlyTo lat={activeCafe.lat} lng={activeCafe.lng} active={true} />
        )}

        {cafes.map((cafe) => {
          const isActive = selectedCafe?.id === cafe.id || activeCafeId === cafe.id;
          return (
            <Marker
              key={cafe.id}
              position={[cafe.lat, cafe.lng]}
              icon={createCoffeeIcon(isActive)}
              ref={(m) => {
                if (m) markersRef.current[cafe.id] = m;
              }}
              eventHandlers={{
                click: () => {
                  setSelectedCafe(cafe);
                },
              }}
            />
          );
        })}
      </MapContainer>

      <Sidebar cafe={selectedCafe} onClose={() => setSelectedCafe(null)} />
    </div>
  );
}
