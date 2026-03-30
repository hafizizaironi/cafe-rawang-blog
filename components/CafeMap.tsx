'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Cafe } from '@/types/cafe';
import { gsap } from 'gsap';

interface CafeMapProps {
  cafes: Cafe[];
  activeCafeId?: string | null;
  onPinClick: (cafeId: string) => void;
}

interface HudState {
  x: number;
  y: number;
  arrowAngle: number;
  isOffScreen: boolean;
}

const EDGE_PAD = 64;

/* ── Cafe pin ──────────────────────────────────────────────── */
function createCoffeeIcon(isActive: boolean) {
  const bg = isActive ? '#c4622d' : '#2d1a0e';
  const border = isActive ? '#f5efe6' : '#c4622d';
  const size = isActive ? 48 : 40;
  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 58" width="${size}" height="${size * 1.2}">
        <circle cx="24" cy="22" r="19" fill="${bg}" stroke="${border}" stroke-width="2.5"/>
        <text x="24" y="29" text-anchor="middle" font-size="16" fill="#f5efe6">☕</text>
        <polygon points="16,41 32,41 24,55" fill="${bg}"/>
      </svg>`,
    className: '',
    iconSize: [size, size * 1.2],
    iconAnchor: [size / 2, size * 1.2],
  });
}

/* ── User HUD — always visible once location is known ──────── */
function UserHUD({ state, onLocate }: { state: HudState; onLocate: () => void }) {
  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        left: state.x,
        top: state.y,
        transform: 'translate(-50%, -50%)',
        transition: 'left 0.08s linear, top 0.08s linear',
      }}
    >
      <button
        onClick={onLocate}
        aria-label={state.isOffScreen ? 'Go to my location' : 'You are here'}
        className="flex flex-col items-center gap-1.5 focus:outline-none"
        style={{ pointerEvents: 'auto' }}
      >
        <svg
          viewBox="-32 -32 64 64"
          width="58"
          height="58"
          style={{
            overflow: 'visible',
            filter: 'drop-shadow(0 3px 10px rgba(196,98,45,0.6))',
          }}
        >
          {/* Pulse ring */}
          <circle
            cx="0" cy="0" r="26"
            fill="none"
            stroke="rgba(196,98,45,0.45)"
            strokeWidth="1.5"
            style={{ animation: 'hudPulse 2.2s ease-out infinite' }}
          />
          {/* Body */}
          <circle cx="0" cy="0" r="20" fill="#1a0f07" stroke="#c4622d" strokeWidth="2.5" />
          {/* Head */}
          <circle cx="0" cy="-6" r="5" fill="#f5efe6" />
          {/* Body shape */}
          <ellipse cx="0" cy="8" rx="7.5" ry="5" fill="#f5efe6" />
          {/* Arrow — only when user is off-screen */}
          {state.isOffScreen && (
            <g style={{ transform: `rotate(${state.arrowAngle}deg)`, transformOrigin: '0 0' }}>
              <rect x="-1.5" y="-31" width="3" height="8" fill="#c4622d" rx="1" />
              <polygon points="0,-33 -5,-26 5,-26" fill="#c4622d" />
            </g>
          )}
        </svg>

        {state.isOffScreen && (
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            padding: '2px 8px',
            borderRadius: 999,
            background: '#1a0f07',
            color: '#f5efe6',
            border: '1px solid rgba(196,98,45,0.5)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}>
            You
          </span>
        )}
      </button>
    </div>
  );
}

/* ── Inner map controller ──────────────────────────────────── */
function MapController({
  cafes,
  activeCafeId,
  onPinClick,
  onUpdateHud,
  flyTrigger,
}: {
  cafes: Cafe[];
  activeCafeId?: string | null;
  onPinClick: (id: string) => void;
  onUpdateHud: (hud: HudState | null) => void;
  flyTrigger: number;
}) {
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const userLatLngRef = useRef<L.LatLng | null>(null);
  const prevFlyTrigger = useRef(0);
  const prevActiveCafe = useRef<string | null | undefined>(null);

  /* Compute the HUD position — always called, updates on every map move */
  const evaluateVisibility = useCallback(
    (map: L.Map, latlng: L.LatLng) => {
      const point = map.latLngToContainerPoint(latlng);
      const { x: w, y: h } = map.getSize();
      if (w === 0 || h === 0) return;

      const inView =
        point.x >= 0 && point.x <= w &&
        point.y >= 0 && point.y <= h;

      if (inView) {
        onUpdateHud({ x: point.x, y: point.y, arrowAngle: 0, isOffScreen: false });
      } else {
        const ex = Math.max(EDGE_PAD, Math.min(w - EDGE_PAD, point.x));
        const ey = Math.max(EDGE_PAD, Math.min(h - EDGE_PAD, point.y));
        const arrowAngle =
          Math.atan2(point.y - ey, point.x - ex) * (180 / Math.PI) + 90;
        onUpdateHud({ x: ex, y: ey, arrowAngle, isOffScreen: true });
      }
    },
    [onUpdateHud]
  );

  const map = useMapEvents({
    locationfound(e) {
      userLatLngRef.current = e.latlng;
      evaluateVisibility(map, e.latlng);
    },
    locationerror() { /* silently ignore */ },
    move()    { if (userLatLngRef.current) evaluateVisibility(map, userLatLngRef.current); },
    moveend() { if (userLatLngRef.current) evaluateVisibility(map, userLatLngRef.current); },
    zoom()    { if (userLatLngRef.current) evaluateVisibility(map, userLatLngRef.current); },
    zoomend() { if (userLatLngRef.current) evaluateVisibility(map, userLatLngRef.current); },
  });

  /* Start GPS watch */
  useEffect(() => {
    map.locate({ watch: true, enableHighAccuracy: true });
    return () => { map.stopLocate(); };
  }, [map]);

  /* Re-center on user when HUD is clicked */
  useEffect(() => {
    if (flyTrigger > 0 && flyTrigger !== prevFlyTrigger.current && userLatLngRef.current) {
      prevFlyTrigger.current = flyTrigger;
      map.flyTo(userLatLngRef.current, 17, { duration: 1.2 });
    }
  }, [flyTrigger, map]);

  /* Fly to selected cafe */
  useEffect(() => {
    if (activeCafeId && activeCafeId !== prevActiveCafe.current) {
      prevActiveCafe.current = activeCafeId;
      const cafe = cafes.find((c) => c.id === activeCafeId);
      if (cafe) map.flyTo([cafe.lat, cafe.lng], 16, { duration: 1.2 });
    }
    if (!activeCafeId) prevActiveCafe.current = null;
  }, [activeCafeId, cafes, map]);

  /* GSAP bounce-in for cafe pins */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    Object.values(markersRef.current).forEach((marker, i) => {
      const el = marker.getElement();
      if (el) {
        gsap.fromTo(el,
          { scale: 0, opacity: 0, transformOrigin: 'bottom center' },
          { scale: 1, opacity: 1, duration: 0.5, delay: 0.6 + i * 0.2, ease: 'back.out(1.7)' }
        );
      }
    });
  }, []);

  return (
    <>
      {cafes.map((cafe) => (
        <Marker
          key={cafe.id}
          position={[cafe.lat, cafe.lng]}
          icon={createCoffeeIcon(activeCafeId === cafe.id)}
          ref={(m) => { if (m) markersRef.current[cafe.id] = m; }}
          eventHandlers={{ click: () => onPinClick(cafe.id) }}
        />
      ))}
    </>
  );
}

/* ── Root export ───────────────────────────────────────────── */
export default function CafeMap({ cafes, activeCafeId, onPinClick }: CafeMapProps) {
  const [hudState, setHudState] = useState<HudState | null>(null);
  const [flyTrigger, setFlyTrigger] = useState(0);

  const handleUpdateHud = useCallback((hud: HudState | null) => {
    setHudState(hud);
  }, []);

  return (
    <>
      <style>{`
        @keyframes hudPulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          70%  { transform: scale(2.5); opacity: 0;   }
          100% { transform: scale(2.5); opacity: 0;   }
        }
      `}</style>

      <div className="relative w-full h-full">
        {/*
          zIndex: 0 on MapContainer creates its own CSS stacking context.
          This contains Leaflet's internal pane z-indexes (200–1000) within it,
          so the UserHUD overlay (z-20 in the parent context) always sits on top.
        */}
        <MapContainer
          center={[3.38, 101.56]}
          zoom={14}
          className="w-full h-full"
          style={{ position: 'relative', zIndex: 0 }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController
            cafes={cafes}
            activeCafeId={activeCafeId}
            onPinClick={onPinClick}
            onUpdateHud={handleUpdateHud}
            flyTrigger={flyTrigger}
          />
        </MapContainer>

        {/* User HUD — renders whenever GPS location is known */}
        {hudState && (
          <UserHUD
            state={hudState}
            onLocate={() => setFlyTrigger((t) => t + 1)}
          />
        )}
      </div>
    </>
  );
}
