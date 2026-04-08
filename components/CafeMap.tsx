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
  photoURL?: string | null;
  pickMode?: boolean;
  onMapPick?: (lat: number, lng: number) => void;
  pickedLatLng?: { lat: number; lng: number } | null;
}

interface HudState {
  x: number;
  y: number;
  arrowAngle: number;
  isOffScreen: boolean;
}

interface HoverState {
  cafe: Cafe;
  x: number;
  y: number;
  phase: 'in' | 'out';
}

const EDGE_PAD = 64;
const CARD_W = 156;
const CARD_H = 196;
const PIN_H  = 48; // icon height
const CARD_GAP = 12; // gap between bottom of card and top of pin circle

/* ── Cafe pin ──────────────────────────────────────────────── */
function createCoffeeIcon(isActive: boolean) {
  const bg     = isActive ? '#c4622d' : '#2d1a0e';
  const border = isActive ? '#f5efe6' : '#c4622d';
  const size   = isActive ? 48 : 40;
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

/* ── Stall pin ─────────────────────────────────────────────── */
function createStallIcon(isActive: boolean) {
  const bg     = isActive ? '#d4952a' : '#0e1e10';
  const border = isActive ? '#f5efe6' : '#d4952a';
  const size   = isActive ? 48 : 40;
  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 58" width="${size}" height="${size * 1.2}">
        <circle cx="24" cy="22" r="19" fill="${bg}" stroke="${border}" stroke-width="2.5"/>
        <text x="24" y="29" text-anchor="middle" font-size="16" fill="#f5efe6">🍜</text>
        <polygon points="16,41 32,41 24,55" fill="${bg}"/>
      </svg>`,
    className: '',
    iconSize: [size, size * 1.2],
    iconAnchor: [size / 2, size * 1.2],
  });
}

/* ── Admin picked-location pin ─────────────────────────────── */
function createPickedPinIcon() {
  return L.divIcon({
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: pinDrop 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
        transform-origin: bottom center;
        filter: drop-shadow(0 6px 16px rgba(196,98,45,0.65));
      ">
        <div style="
          width: 34px; height: 34px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: #c4622d;
          border: 3px solid #f5efe6;
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="
            width: 11px; height: 11px; border-radius: 50%;
            background: #f5efe6; transform: rotate(45deg);
          "></div>
        </div>
        <div style="width:2px;height:8px;background:#c4622d;margin-top:-1px;border-radius:0 0 2px 2px;"></div>
      </div>`,
    className: '',
    iconSize: [34, 50],
    iconAnchor: [17, 50],
  });
}

/* ── Photo hover card ──────────────────────────────────────── */
function PhotoCard({
  hover,
  onExitDone,
}: {
  hover: HoverState;
  onExitDone: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { cafe, x, y, phase } = hover;

  const left = Math.round(x - CARD_W / 2);
  const top  = Math.round(y - PIN_H - CARD_GAP - CARD_H);

  const isStall = cafe.type === 'stall';
  const heroBg  = isStall
    ? 'linear-gradient(160deg, #0e1e10 0%, #2a5c2a 55%, #d4952a 100%)'
    : 'linear-gradient(160deg, #1a0f07 0%, #3d2010 55%, #c4622d 100%)';
  const emoji = isStall ? '🍜' : '☕';

  /* Enter animation — runs once on mount */
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.68, y: 20, transformOrigin: 'bottom center' },
      { opacity: 1, scale: 1,    y: 0,  duration: 0.42, ease: 'back.out(2.2)' }
    );
  }, []);

  /* Exit animation — fires when phase flips to 'out' */
  useEffect(() => {
    if (phase !== 'out') return;
    const el = cardRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.to(el, {
      opacity: 0,
      scale: 0.76,
      y: 12,
      transformOrigin: 'bottom center',
      duration: 0.3,
      ease: 'power3.in',
      onComplete: onExitDone,
    });
  }, [phase, onExitDone]);

  return (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        left,
        top,
        width: CARD_W,
        height: CARD_H,
        borderRadius: 18,
        overflow: 'visible',
        zIndex: 9999,
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }}
    >
      {/* Photo frame */}
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: 18,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1.5px rgba(255,255,255,0.08)',
      }}>
        {/* Gradient background (shown while image loads or if no real photo) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: heroBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 58,
          opacity: 0.28,
        }}>
          {emoji}
        </div>

        {/* Real photo — overlaid on gradient; if missing, gradient shows through */}
        <img
          src={cafe.photos[0]}
          alt={cafe.name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* Caret pointer pointing down toward the pin */}
      <div style={{
        position: 'absolute',
        bottom: -10,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderTop: '11px solid rgba(10,6,3,0.72)',
        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))',
      }} />
    </div>
  );
}

/* ── User HUD — always visible once location is known ──────── */
function UserHUD({
  state,
  onLocate,
  photoURL,
}: {
  state: HudState;
  onLocate: () => void;
  photoURL?: string | null;
}) {
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
        {photoURL ? (
          /* ── Photo marker ───────────────────────────────────── */
          <div style={{ position: 'relative', width: 58, height: 58 }}>
            {/* Pulse ring */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1.5px solid rgba(196,98,45,0.45)',
              animation: 'hudPulse 2.2s ease-out infinite',
            }} />
            {/* Photo circle */}
            <div style={{
              position: 'absolute',
              inset: 9,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2.5px solid #c4622d',
              boxShadow: '0 2px 12px rgba(196,98,45,0.6)',
            }}>
              <img
                src={photoURL}
                alt="You"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {/* Directional arrow badge — only when off-screen */}
            {state.isOffScreen && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg
                  viewBox="-32 -32 64 64"
                  width="58"
                  height="58"
                  style={{ overflow: 'visible', position: 'absolute' }}
                >
                  <g style={{ transform: `rotate(${state.arrowAngle}deg)`, transformOrigin: '0 0' }}>
                    <rect x="-1.5" y="-31" width="3" height="8" fill="#c4622d" rx="1" />
                    <polygon points="0,-33 -5,-26 5,-26" fill="#c4622d" />
                  </g>
                </svg>
              </div>
            )}
          </div>
        ) : (
          /* ── Default SVG person marker ──────────────────────── */
          <svg
            viewBox="-32 -32 64 64"
            width="58"
            height="58"
            style={{
              overflow: 'visible',
              filter: 'drop-shadow(0 3px 10px rgba(196,98,45,0.6))',
            }}
          >
            <circle
              cx="0" cy="0" r="26"
              fill="none"
              stroke="rgba(196,98,45,0.45)"
              strokeWidth="1.5"
              style={{ animation: 'hudPulse 2.2s ease-out infinite' }}
            />
            <circle cx="0" cy="0" r="20" fill="#1a0f07" stroke="#c4622d" strokeWidth="2.5" />
            <circle cx="0" cy="-6" r="5" fill="#f5efe6" />
            <ellipse cx="0" cy="8" rx="7.5" ry="5" fill="#f5efe6" />
            {state.isOffScreen && (
              <g style={{ transform: `rotate(${state.arrowAngle}deg)`, transformOrigin: '0 0' }}>
                <rect x="-1.5" y="-31" width="3" height="8" fill="#c4622d" rx="1" />
                <polygon points="0,-33 -5,-26 5,-26" fill="#c4622d" />
              </g>
            )}
          </svg>
        )}

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
  hoveredCafeLatLng,
  onHoverPositionUpdate,
  onMarkerEnter,
  onMarkerLeave,
  pickMode,
  onMapPickInternal,
  pickedLatLng,
}: {
  cafes: Cafe[];
  activeCafeId?: string | null;
  onPinClick: (id: string) => void;
  onUpdateHud: (hud: HudState | null) => void;
  flyTrigger: number;
  hoveredCafeLatLng: L.LatLngExpression | null;
  onHoverPositionUpdate: (x: number, y: number) => void;
  onMarkerEnter: (cafe: Cafe, x: number, y: number) => void;
  onMarkerLeave: () => void;
  pickMode?: boolean;
  onMapPickInternal?: (lat: number, lng: number, cx: number, cy: number) => void;
  pickedLatLng?: { lat: number; lng: number } | null;
}) {
  const markersRef   = useRef<{ [id: string]: L.Marker }>({});
  const userLatLngRef  = useRef<L.LatLng | null>(null);
  const prevFlyTrigger = useRef(0);
  const prevActiveCafe = useRef<string | null | undefined>(null);

  const evaluateVisibility = useCallback(
    (map: L.Map, latlng: L.LatLng) => {
      const point = map.latLngToContainerPoint(latlng);
      const { x: w, y: h } = map.getSize();
      if (w === 0 || h === 0) return;
      const inView = point.x >= 0 && point.x <= w && point.y >= 0 && point.y <= h;
      if (inView) {
        onUpdateHud({ x: point.x, y: point.y, arrowAngle: 0, isOffScreen: false });
      } else {
        const ex = Math.max(EDGE_PAD, Math.min(w - EDGE_PAD, point.x));
        const ey = Math.max(EDGE_PAD, Math.min(h - EDGE_PAD, point.y));
        const arrowAngle = Math.atan2(point.y - ey, point.x - ex) * (180 / Math.PI) + 90;
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
    click(e) {
      if (pickMode && onMapPickInternal) {
        onMapPickInternal(
          e.latlng.lat,
          e.latlng.lng,
          e.containerPoint.x,
          e.containerPoint.y,
        );
      }
    },
    move() {
      if (userLatLngRef.current) evaluateVisibility(map, userLatLngRef.current);
      if (hoveredCafeLatLng) {
        const p = map.latLngToContainerPoint(hoveredCafeLatLng);
        onHoverPositionUpdate(p.x, p.y);
      }
    },
    moveend() {
      if (userLatLngRef.current) evaluateVisibility(map, userLatLngRef.current);
    },
    zoom() {
      if (userLatLngRef.current) evaluateVisibility(map, userLatLngRef.current);
      if (hoveredCafeLatLng) {
        const p = map.latLngToContainerPoint(hoveredCafeLatLng);
        onHoverPositionUpdate(p.x, p.y);
      }
    },
    zoomend() {
      if (userLatLngRef.current) evaluateVisibility(map, userLatLngRef.current);
    },
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

  /* GSAP bounce-in for pins */
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
      {/* Persistent admin pick marker */}
      {pickedLatLng && (
        <Marker
          key={`pick-${pickedLatLng.lat}-${pickedLatLng.lng}`}
          position={[pickedLatLng.lat, pickedLatLng.lng]}
          icon={createPickedPinIcon()}
          zIndexOffset={2000}
          interactive={false}
        />
      )}

      {cafes.map((cafe) => (
        <Marker
          key={cafe.id}
          position={[cafe.lat, cafe.lng]}
          icon={
            cafe.type === 'stall'
              ? createStallIcon(activeCafeId === cafe.id)
              : createCoffeeIcon(activeCafeId === cafe.id)
          }
          ref={(m) => { if (m) markersRef.current[cafe.id] = m; }}
          eventHandlers={{
            click: () => onPinClick(cafe.id),
            mouseover: () => {
              const p = map.latLngToContainerPoint([cafe.lat, cafe.lng]);
              onMarkerEnter(cafe, p.x, p.y);
            },
            mouseout: () => onMarkerLeave(),
          }}
        />
      ))}
    </>
  );
}

/* ── Root export ───────────────────────────────────────────── */
export default function CafeMap({ cafes, activeCafeId, onPinClick, photoURL, pickMode, onMapPick, pickedLatLng }: CafeMapProps) {
  const [hudState,    setHudState]    = useState<HudState | null>(null);
  const [flyTrigger,  setFlyTrigger]  = useState(0);
  const [hover,       setHover]       = useState<HoverState | null>(null);
  const [ripple,      setRipple]      = useState<{ x: number; y: number } | null>(null);
  const leaveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rippleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorRef      = useRef<HTMLDivElement>(null);

  const hoveredCafeLatLng = hover
    ? ([hover.cafe.lat, hover.cafe.lng] as L.LatLngExpression)
    : null;

  const handleUpdateHud = useCallback((hud: HudState | null) => {
    setHudState(hud);
  }, []);

  /* Internal pick handler — captures container coords for ripple */
  const handleMapPickInternal = useCallback((lat: number, lng: number, cx: number, cy: number) => {
    /* Ripple at click point */
    if (rippleTimerRef.current) clearTimeout(rippleTimerRef.current);
    setRipple({ x: cx, y: cy });
    rippleTimerRef.current = setTimeout(() => setRipple(null), 900);
    /* Notify parent with just geo coords */
    onMapPick?.(lat, lng);
  }, [onMapPick]);

  /* Mouse tracking — direct DOM update, no React re-render */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!pickMode || !cursorRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cursorRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    cursorRef.current.style.opacity = '1';
  }, [pickMode]);

  const handleMouseLeave = useCallback(() => {
    if (cursorRef.current) cursorRef.current.style.opacity = '0';
  }, []);

  const handleMarkerEnter = useCallback((cafe: Cafe, x: number, y: number) => {
    /* Cancel any pending leave timer */
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setHover((prev) => {
      if (prev?.cafe.id === cafe.id) return { ...prev, x, y, phase: 'in' };
      return { cafe, x, y, phase: 'in' };
    });
  }, []);

  const handleMarkerLeave = useCallback(() => {
    /* 1.4 s linger, then trigger exit animation */
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setHover((prev) => (prev ? { ...prev, phase: 'out' } : null));
    }, 1400);
  }, []);

  const handleExitDone = useCallback(() => {
    setHover(null);
  }, []);

  const handleHoverPositionUpdate = useCallback((x: number, y: number) => {
    setHover((prev) => (prev ? { ...prev, x, y } : null));
  }, []);

  return (
    <>
      <style>{`
        @keyframes hudPulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          70%  { transform: scale(2.5); opacity: 0;   }
          100% { transform: scale(2.5); opacity: 0;   }
        }
        @keyframes pinDrop {
          0%   { transform: scale(0.4) translateY(-24px); opacity: 0; }
          60%  { transform: scale(1.15) translateY(4px);  opacity: 1; }
          80%  { transform: scale(0.93) translateY(-2px); }
          100% { transform: scale(1)   translateY(0);     opacity: 1; }
        }
        @keyframes pickRipple {
          0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.9; }
          60%  { opacity: 0.4; }
          100% { transform: translate(-50%,-50%) scale(3.2); opacity: 0; }
        }
        @keyframes pickRipple2 {
          0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.5; }
          100% { transform: translate(-50%,-50%) scale(2); opacity: 0; }
        }
      `}</style>

      <div
        className="relative w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <MapContainer
          center={[3.38, 101.56]}
          zoom={14}
          className="w-full h-full"
          style={{ position: 'relative', zIndex: 0, cursor: pickMode ? 'none' : '' }}
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
            hoveredCafeLatLng={hoveredCafeLatLng}
            onHoverPositionUpdate={handleHoverPositionUpdate}
            onMarkerEnter={handleMarkerEnter}
            onMarkerLeave={handleMarkerLeave}
            pickMode={pickMode}
            onMapPickInternal={handleMapPickInternal}
            pickedLatLng={pickedLatLng}
          />
        </MapContainer>

        {/* User HUD */}
        {hudState && (
          <UserHUD
            state={hudState}
            onLocate={() => setFlyTrigger((t) => t + 1)}
            photoURL={photoURL}
          />
        )}

        {/* Photo hover card — rendered outside Leaflet's DOM so GSAP/z-index work cleanly */}
        {hover && (
          <PhotoCard
            key={hover.cafe.id}
            hover={hover}
            onExitDone={handleExitDone}
          />
        )}

        {/* 📍 emoji cursor — follows mouse with no re-renders */}
        <div
          ref={cursorRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 9000,
            pointerEvents: 'none',
            opacity: 0,
            display: pickMode ? 'block' : 'none',
            fontSize: 28,
            lineHeight: 1,
            userSelect: 'none',
            willChange: 'transform',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
          }}
        >
          📍
        </div>

        {/* Click ripple animation */}
        {ripple && (
          <div
            key={`${ripple.x}-${ripple.y}`}
            style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              zIndex: 8999,
              pointerEvents: 'none',
            }}
          >
            {/* Outer ring */}
            <div style={{
              position: 'absolute',
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '2px solid rgba(196,98,45,0.7)',
              animation: 'pickRipple 0.85s cubic-bezier(0.2,0,0.4,1) forwards',
            }} />
            {/* Inner fill */}
            <div style={{
              position: 'absolute',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(196,98,45,0.25)',
              animation: 'pickRipple2 0.5s cubic-bezier(0.2,0,0.4,1) forwards',
            }} />
          </div>
        )}
      </div>
    </>
  );
}
