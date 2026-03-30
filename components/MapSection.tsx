'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Cafe } from '@/types/cafe';

const CafeMap = dynamic(() => import('./CafeMap'), { ssr: false });

const PLACEHOLDER_GRADIENTS = [
  'linear-gradient(135deg, #1a0f07 0%, #7a8c5e 100%)',
  'linear-gradient(160deg, #2d1a0e 0%, #c4622d 100%)',
  'linear-gradient(135deg, #7a8c5e 0%, #1a0f07 100%)',
];

interface MapSectionProps {
  cafes: Cafe[];
}

/* ─── Mini cafe card for the panel list ─────────────────────── */
function PanelCard({
  cafe,
  index,
  isActive,
  onClick,
}: {
  cafe: Cafe;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl overflow-hidden transition-all duration-200 border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
        isActive
          ? 'border-terracotta bg-espresso-light shadow-lg shadow-terracotta/20'
          : 'border-transparent bg-espresso-light/60 hover:bg-espresso-light hover:border-terracotta/30'
      }`}
    >
      {/* Photo strip */}
      <div
        className="w-full h-28 relative"
        style={{ background: PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length] }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20 select-none">
          ☕
        </div>
        {isActive && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-terracotta shadow-md shadow-terracotta/50 animate-pulse" />
        )}
      </div>
      {/* Info */}
      <div className="px-4 py-3">
        <span className="text-olive text-[10px] font-medium uppercase tracking-widest">
          {cafe.neighborhood}
        </span>
        <h3 className="font-display text-base font-bold text-cream leading-snug mt-0.5">
          {cafe.name}
        </h3>
        <p className="text-cream/50 text-xs mt-1 leading-relaxed line-clamp-2">{cafe.tagline}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {cafe.vibeTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-terracotta/30 text-terracotta/80"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

/* ─── Detail view inside the panel ──────────────────────────── */
function PanelDetail({ cafe, onBack }: { cafe: Cafe; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-cream/50 hover:text-cream text-xs font-medium px-5 py-4 transition-colors shrink-0"
      >
        ← All cafes
      </button>

      {/* Hero photo */}
      <div
        className="w-full h-44 shrink-0"
        style={{ background: PLACEHOLDER_GRADIENTS[parseInt(cafe.id) % PLACEHOLDER_GRADIENTS.length] }}
      >
        <div className="w-full h-full flex items-center justify-center text-6xl opacity-20 select-none">
          ☕
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-5 flex flex-col gap-4 flex-1">
        <div>
          <span className="text-olive text-[10px] font-medium uppercase tracking-widest">
            {cafe.neighborhood} · Rawang
          </span>
          <h2 className="font-display text-2xl font-bold text-cream leading-tight mt-1">
            {cafe.name}
          </h2>
          <p className="text-terracotta text-sm mt-1 italic">&ldquo;{cafe.tagline}&rdquo;</p>
        </div>

        {/* Hours */}
        <div className="flex items-center gap-2 text-cream/60 text-sm">
          <span>🕐</span>
          <span>{cafe.hours}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {cafe.vibeTags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-xs font-medium bg-terracotta/15 text-terracotta border border-terracotta/30"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-cream/65 text-sm leading-relaxed">{cafe.description}</p>

        {/* CTA */}
        <Link
          href={`/cafes/${cafe.slug}`}
          className="mt-auto block text-center py-3 px-4 bg-terracotta text-cream rounded-xl text-sm font-semibold hover:bg-terracotta/80 transition-colors"
        >
          Read full story →
        </Link>
      </div>
    </div>
  );
}

/* ─── Main MapSection ────────────────────────────────────────── */
type PanelView = 'list' | 'detail';
type BottomSheetState = 'peek' | 'expanded';

export default function MapSection({ cafes }: MapSectionProps) {
  const [activeCafeId, setActiveCafeId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelView, setPanelView] = useState<PanelView>('list');
  const [bottomSheet, setBottomSheet] = useState<BottomSheetState>('peek');
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const activeCafe = cafes.find((c) => c.id === activeCafeId) ?? null;

  const selectCafe = useCallback(
    (cafeId: string) => {
      setActiveCafeId(cafeId);
      setPanelView('detail');
      setPanelOpen(true);
      setBottomSheet('expanded');
      // Scroll the card into view in panel list (for UX when going back)
      setTimeout(() => {
        cardRefs.current[cafeId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    },
    []
  );

  const goBackToList = useCallback(() => {
    setPanelView('list');
    setActiveCafeId(null);
  }, []);

  // Close detail when panel is collapsed
  useEffect(() => {
    if (!panelOpen) setPanelView('list');
  }, [panelOpen]);

  return (
    <section id="map-section" className="relative w-full h-screen overflow-hidden">
      {/* ── Full-screen map ───────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <CafeMap
          cafes={cafes}
          activeCafeId={activeCafeId}
          onPinClick={selectCafe}
        />
      </div>

      {/* ══════════════════════════════════════════════════════
          DESKTOP: Floating left panel
      ══════════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        {/* Panel */}
        <div
          className={`absolute top-4 left-4 bottom-4 z-10 flex flex-col rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-in-out ${
            panelOpen ? 'w-[380px] opacity-100' : 'w-0 opacity-0 pointer-events-none'
          }`}
          style={{ background: '#1a0f07' }}
        >
          {/* Panel header */}
          <div className="shrink-0 px-5 py-4 border-b border-cream/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-cream">
                  {panelView === 'detail' && activeCafe ? activeCafe.name : 'Cafes Around Rawang'}
                </h2>
                {panelView === 'list' && (
                  <p className="text-cream/40 text-xs mt-0.5">{cafes.length} spots found</p>
                )}
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="w-8 h-8 rounded-full bg-cream/10 hover:bg-cream/20 text-cream/60 hover:text-cream flex items-center justify-center transition-colors text-sm"
                aria-label="Collapse panel"
              >
                ←
              </button>
            </div>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto">
            {panelView === 'list' ? (
              <div className="p-4 flex flex-col gap-3">
                {cafes.map((cafe, i) => (
                  <div key={cafe.id} ref={(el) => { cardRefs.current[cafe.id] = el; }}>
                    <PanelCard
                      cafe={cafe}
                      index={i}
                      isActive={activeCafeId === cafe.id}
                      onClick={() => selectCafe(cafe.id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              activeCafe && <PanelDetail cafe={activeCafe} onBack={goBackToList} />
            )}
          </div>
        </div>

        {/* Collapsed pill — re-open button */}
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-3 rounded-xl bg-espresso text-cream text-sm font-semibold shadow-xl hover:bg-espresso-light transition-all duration-200 border border-cream/10"
          >
            <span>☕</span>
            <span>Cafes</span>
            <span className="text-cream/50 text-xs">→</span>
          </button>
        )}

        {/* Toggle arrow on right edge of panel */}
        {panelOpen && (
          <button
            onClick={() => setPanelOpen(false)}
            className="absolute top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-espresso hover:bg-espresso-light rounded-r-lg flex items-center justify-center text-cream/50 hover:text-cream transition-all shadow-md border-r border-t border-b border-cream/10"
            style={{ left: 'calc(1rem + 380px)' }}
            aria-label="Collapse panel"
          >
            ‹
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          MOBILE: Bottom sheet
      ══════════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        {/* Drag handle + sheet */}
        <div
          className={`absolute left-0 right-0 bottom-0 z-10 rounded-t-2xl shadow-2xl transition-all duration-500 ease-out flex flex-col overflow-hidden`}
          style={{
            background: '#1a0f07',
            height: bottomSheet === 'expanded' ? '65vh' : '140px',
          }}
        >
          {/* Drag handle bar */}
          <div
            className="flex flex-col items-center pt-3 pb-2 shrink-0 cursor-pointer"
            onClick={() =>
              setBottomSheet((s) => (s === 'peek' ? 'expanded' : 'peek'))
            }
          >
            <div className="w-10 h-1 rounded-full bg-cream/20 mb-2" />
            <div className="flex items-center justify-between w-full px-5">
              <p className="text-cream text-sm font-semibold font-display">
                {panelView === 'detail' && activeCafe
                  ? activeCafe.name
                  : `${cafes.length} cafes nearby`}
              </p>
              <span className="text-cream/40 text-xs">
                {bottomSheet === 'peek' ? '↑ expand' : '↓ collapse'}
              </span>
            </div>
          </div>

          {/* Sheet body */}
          <div className="flex-1 overflow-y-auto">
            {panelView === 'list' ? (
              <div className="px-4 pb-4 flex flex-col gap-3">
                {cafes.map((cafe, i) => (
                  <div key={cafe.id}>
                    <PanelCard
                      cafe={cafe}
                      index={i}
                      isActive={activeCafeId === cafe.id}
                      onClick={() => selectCafe(cafe.id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              activeCafe && <PanelDetail cafe={activeCafe} onBack={goBackToList} />
            )}
          </div>
        </div>
      </div>

      {/* ── Zoom controls (custom, top-right) ─────────────────── */}
      <div className="absolute bottom-8 right-4 z-10 hidden lg:flex flex-col gap-1.5">
        <div className="leaflet-zoom-buttons flex flex-col rounded-xl overflow-hidden shadow-lg border border-cream/10">
          {/* These are rendered by Leaflet itself — we just style the container area */}
        </div>
      </div>

      {/* ── Attribution nudge ─────────────────────────────────── */}
      <div className="absolute bottom-2 right-2 z-10 text-[10px] text-espresso/40 pointer-events-none">
        © OpenStreetMap contributors
      </div>
    </section>
  );
}
