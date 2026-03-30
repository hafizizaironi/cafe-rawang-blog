'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Cafe } from '@/types/cafe';
import { gsap } from 'gsap';

interface CafeMapProps {
  cafes: Cafe[];
  activeCafeId?: string | null;
  onPinClick: (cafeId: string) => void;
}

function createCoffeeIcon(isActive: boolean) {
  const bg = isActive ? '#c4622d' : '#2d1a0e';
  const border = isActive ? '#f5efe6' : '#c4622d';
  const size = isActive ? 48 : 40;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 58" width="${size}" height="${size * 1.2}">
      <circle cx="24" cy="22" r="19" fill="${bg}" stroke="${border}" stroke-width="2.5"/>
      <text x="24" y="29" text-anchor="middle" font-size="16" fill="#f5efe6">☕</text>
      <polygon points="16,41 32,41 24,55" fill="${bg}"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size * 1.2],
    iconAnchor: [size / 2, size * 1.2],
    popupAnchor: [0, -size * 1.2],
  });
}

function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

export default function CafeMap({ cafes, activeCafeId, onPinClick }: CafeMapProps) {
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    Object.values(markersRef.current).forEach((marker, i) => {
      const el = marker.getElement();
      if (el) {
        gsap.fromTo(
          el,
          { scale: 0, opacity: 0, transformOrigin: 'bottom center' },
          { scale: 1, opacity: 1, duration: 0.5, delay: 0.6 + i * 0.2, ease: 'back.out(1.7)' }
        );
      }
    });
  }, []);

  const activeCafe = activeCafeId ? cafes.find((c) => c.id === activeCafeId) : null;

  return (
    <MapContainer
      center={[3.38, 101.56]}
      zoom={14}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {activeCafe && <MapFlyTo lat={activeCafe.lat} lng={activeCafe.lng} />}

      {cafes.map((cafe) => (
        <Marker
          key={cafe.id}
          position={[cafe.lat, cafe.lng]}
          icon={createCoffeeIcon(activeCafeId === cafe.id)}
          ref={(m) => { if (m) markersRef.current[cafe.id] = m; }}
          eventHandlers={{ click: () => onPinClick(cafe.id) }}
        />
      ))}
    </MapContainer>
  );
}
