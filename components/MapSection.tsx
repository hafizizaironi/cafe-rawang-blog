'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Cafe, PlaceType } from '@/types/cafe';
import ProfilePanel from './ProfilePanel';
import AdminAddPanel from './AdminAddPanel';
import { type User } from '@/lib/firebase';
import { subscribeToCafes, deletePlace } from '@/lib/firestore';

const CafeMap = dynamic(() => import('./CafeMap'), { ssr: false });

/* ── Theme helpers ─────────────────────────────────────────── */
const CAFE_GRADIENTS = [
  'linear-gradient(135deg, #1a0f07 0%, #7a8c5e 100%)',
  'linear-gradient(160deg, #2d1a0e 0%, #c4622d 100%)',
  'linear-gradient(135deg, #7a8c5e 0%, #1a0f07 100%)',
];

const STALL_GRADIENTS = [
  'linear-gradient(135deg, #0e1e10 0%, #6aaa6a 100%)',
  'linear-gradient(160deg, #1a3520 0%, #d4952a 100%)',
  'linear-gradient(135deg, #6aaa6a 0%, #0e1e10 100%)',
];

function getGradients(type: PlaceType) {
  return type === 'stall' ? STALL_GRADIENTS : CAFE_GRADIENTS;
}

function getAccent(type: PlaceType) {
  return type === 'stall' ? '#d4952a' : '#c4622d';
}

function getEmoji(type: PlaceType) {
  return type === 'stall' ? '🍜' : '☕';
}

interface MapSectionProps {
  user?: User | null;
  isAdmin?: boolean;
  onSignOut?: () => void;
}

/* ─── Mini card for the panel list ──────────────────────────── */
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
  const accent = getAccent(cafe.type);
  const gradients = getGradients(cafe.type);
  const emoji = getEmoji(cafe.type);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl overflow-hidden transition-all duration-200 border-2 focus:outline-none focus-visible:ring-2`}
      style={{
        borderColor: isActive ? accent : 'transparent',
        backgroundColor: isActive
          ? cafe.type === 'stall' ? '#1a3520' : '#2d1a0e'
          : cafe.type === 'stall' ? 'rgba(26,53,32,0.6)' : 'rgba(45,26,14,0.6)',
        boxShadow: isActive ? `0 4px 16px ${accent}33` : undefined,
      }}
    >
      {/* Photo strip */}
      <div
        className="w-full h-28 relative"
        style={{ background: gradients[index % gradients.length] }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20 select-none">
          {emoji}
        </div>
        {/* Type badge */}
        <span
          className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{
            background: cafe.type === 'stall' ? '#0e1e10cc' : '#1a0f07cc',
            color: accent,
            border: `1px solid ${accent}55`,
          }}
        >
          {cafe.type === 'stall' ? 'Street Stall' : 'Café'}
        </span>
        {isActive && (
          <span
            className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full shadow-md animate-pulse"
            style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}` }}
          />
        )}
      </div>
      {/* Info */}
      <div className="px-4 py-3">
        <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: '#7a8c5e' }}>
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
              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                border: `1px solid ${accent}44`,
                color: `${accent}cc`,
              }}
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
function PanelDetail({
  cafe,
  onBack,
  filterLabel,
  isAdmin,
  onEdit,
  onDelete,
}: {
  cafe: Cafe;
  onBack: () => void;
  filterLabel: string;
  isAdmin?: boolean;
  onEdit?: (x: number, y: number) => void;
  onDelete?: () => Promise<void>;
}) {
  const accent = getAccent(cafe.type);
  const gradients = getGradients(cafe.type);
  const emoji = getEmoji(cafe.type);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-cream/50 hover:text-cream text-xs font-medium px-5 py-4 transition-colors shrink-0"
      >
        ← {filterLabel}
      </button>

      {/* Hero photo */}
      <div
        className="w-full h-44 shrink-0 relative"
        style={{ background: gradients[parseInt(cafe.id) % gradients.length] }}
      >
        <div className="w-full h-full flex items-center justify-center text-6xl opacity-20 select-none">
          {emoji}
        </div>
        <span
          className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{
            background: cafe.type === 'stall' ? '#0e1e10dd' : '#1a0f07dd',
            color: accent,
            border: `1px solid ${accent}55`,
          }}
        >
          {cafe.type === 'stall' ? 'Street Stall' : 'Café'}
        </span>
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
          <p className="text-sm mt-1 italic" style={{ color: accent }}>
            &ldquo;{cafe.tagline}&rdquo;
          </p>
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
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: `${accent}18`,
                color: accent,
                border: `1px solid ${accent}40`,
              }}
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
          className="mt-auto block text-center py-3 px-4 rounded-xl text-sm font-semibold text-cream transition-colors"
          style={{ backgroundColor: accent }}
        >
          Read full story →
        </Link>

        {/* Admin edit */}
        {isAdmin && onEdit && (
          <button
            onClick={(e) => onEdit(e.clientX, e.clientY)}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors border"
            style={{ color: '#c4622d', borderColor: 'rgba(196,98,45,0.35)', background: 'rgba(196,98,45,0.08)' }}
          >
            ✏️ Edit details
          </button>
        )}

        {/* Admin delete */}
        {isAdmin && onDelete && (
          <div className="mt-1">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors border"
                style={{ color: '#e05c5c', borderColor: '#e05c5c44', background: '#e05c5c0d' }}
              >
                🗑 Remove this place
              </button>
            ) : (
              <div
                className="rounded-xl p-4 flex flex-col gap-3 border"
                style={{ background: '#1f0c0c', borderColor: '#e05c5c44' }}
              >
                <p className="text-sm text-center" style={{ color: '#e05c5c' }}>
                  Remove <strong>{cafe.name}</strong> from the map?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="flex-1 py-2 rounded-lg text-sm font-medium text-cream/60 bg-cream/10 hover:bg-cream/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2 rounded-lg text-sm font-bold text-cream transition-colors"
                    style={{ background: deleting ? '#7a3333' : '#c0392b' }}
                  >
                    {deleting ? 'Removing…' : 'Yes, remove'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Filter tab bar ─────────────────────────────────────────── */
type FilterType = 'all' | PlaceType;

function FilterTabs({
  active,
  counts,
  onChange,
}: {
  active: FilterType;
  counts: { all: number; cafe: number; stall: number };
  onChange: (f: FilterType) => void;
}) {
  const tabs: { key: FilterType; label: string; emoji: string }[] = [
    { key: 'all', label: 'All', emoji: '📍' },
    { key: 'cafe', label: 'Cafés', emoji: '☕' },
    { key: 'stall', label: 'Stalls', emoji: '🍜' },
  ];

  return (
    <div className="flex gap-1.5 px-4 pt-3 pb-2 shrink-0">
      {tabs.map(({ key, label, emoji }) => {
        const isActive = active === key;
        const count = counts[key];
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200"
            style={{
              background: isActive
                ? key === 'stall' ? '#d4952a' : key === 'cafe' ? '#c4622d' : '#3a2518'
                : 'rgba(245,239,230,0.06)',
              color: isActive ? '#f5efe6' : 'rgba(245,239,230,0.45)',
              border: isActive ? 'none' : '1px solid rgba(245,239,230,0.1)',
            }}
          >
            <span>{emoji}</span>
            <span>{label}</span>
            <span
              className="rounded-full px-1 text-[10px]"
              style={{
                background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(245,239,230,0.1)',
                color: isActive ? '#f5efe6cc' : 'rgba(245,239,230,0.3)',
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Main MapSection ────────────────────────────────────────── */
type PanelView = 'list' | 'detail';
type BottomSheetState = 'peek' | 'expanded';

export default function MapSection({ user, isAdmin, onSignOut }: MapSectionProps) {
  const [activeCafeId, setActiveCafeId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelView, setPanelView] = useState<PanelView>('list');
  const [bottomSheet, setBottomSheet] = useState<BottomSheetState>('peek');
  const [filter, setFilter] = useState<FilterType>('all');
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [editCafe, setEditCafe] = useState<Cafe | null>(null);
  // Ref instead of state — we write it directly to the DOM so the browser
  // registers the "from" value before the transition fires.
  const adminOriginRef = useRef({ x: 0, y: 0 });
  const adminPanelRef = useRef<HTMLDivElement>(null);
  const [pickMode, setPickMode] = useState(false);
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(null);

  /* Firestore cafes — single source of truth */
  const [cafes, setCafes] = useState<Cafe[]>([]);
  useEffect(() => {
    const unsub = subscribeToCafes(setCafes);
    return () => unsub();
  }, []);

  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  /**
   * Open the admin panel with the circle expanding from (x, y).
   * Direct DOM write + forced reflow ensures the browser registers
   * circle(0% at x y) as the "from" state before the CSS transition fires,
   * so the animation always starts from the exact click/touch point.
   */
  const openAdmin = useCallback((x: number, y: number, cafe: Cafe | null = null) => {
    const TRANSITION = 'clip-path 0.65s cubic-bezier(0.4, 0, 0.2, 1)';
    adminOriginRef.current = { x, y };
    const panel = adminPanelRef.current;
    if (panel) {
      panel.style.transition = 'none';
      panel.style.clipPath = `circle(0% at ${x}px ${y}px)`;
      panel.getBoundingClientRect(); // force style flush
      panel.style.transition = TRANSITION;
    }
    setEditCafe(cafe);
    setAdminOpen(true);
    setProfileOpen(false);
    setPickMode(false);
  }, []);

  const filteredCafes = filter === 'all' ? cafes : cafes.filter((c) => c.type === filter);
  const activeCafe = cafes.find((c) => c.id === activeCafeId) ?? null;

  const counts = {
    all: cafes.length,
    cafe: cafes.filter((c) => c.type === 'cafe').length,
    stall: cafes.filter((c) => c.type === 'stall').length,
  };

  const filterLabel =
    filter === 'cafe' ? 'All cafés' : filter === 'stall' ? 'All stalls' : 'All spots';

  const selectCafe = useCallback(
    (cafeId: string) => {
      setActiveCafeId(cafeId);
      setPanelView('detail');
      setPanelOpen(true);
      setBottomSheet('expanded');
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

  const handleFilterChange = useCallback((f: FilterType) => {
    setFilter(f);
    setPanelView('list');
    setActiveCafeId(null);
  }, []);

  // Close detail when panel is collapsed
  useEffect(() => {
    if (!panelOpen) setPanelView('list');
  }, [panelOpen]);

  const panelTitle =
    panelView === 'detail' && activeCafe
      ? activeCafe.name
      : filter === 'cafe'
      ? 'Cafés Around Rawang'
      : filter === 'stall'
      ? 'Street Stalls'
      : 'Spots Around Rawang';

  const collapsedLabel =
    filter === 'cafe' ? '☕ Cafés' : filter === 'stall' ? '🍜 Stalls' : '📍 Spots';

  const bottomSheetSummary =
    panelView === 'detail' && activeCafe
      ? activeCafe.name
      : `${filteredCafes.length} ${filter === 'cafe' ? 'cafés' : filter === 'stall' ? 'stalls' : 'spots'} nearby`;

  return (
    <section id="map-section" className="relative w-full h-screen overflow-hidden">
      {/* ── Full-screen map ───────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <CafeMap
          cafes={filteredCafes}
          activeCafeId={activeCafeId}
          onPinClick={selectCafe}
          photoURL={user?.photoURL}
          pickMode={pickMode}
          onMapPick={(lat, lng) => setPickedCoords({ lat, lng })}
          pickedLatLng={pickedCoords}
        />
      </div>

      {/* ── Top-right buttons ─────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Profile button */}
        {user && (
          <button
            onClick={() => { setProfileOpen(true); setAdminOpen(false); }}
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ border: '2px solid rgba(196,98,45,0.6)' }}
            aria-label="Open profile"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-sm font-bold font-display"
                style={{ background: 'linear-gradient(135deg, #c4622d 0%, #7a4a24 100%)', color: '#f5efe6' }}
              >
                {(user.displayName ?? user.email ?? 'U')
                  .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}
          </button>
        )}

        {/* Admin add button */}
        {isAdmin && (
          <button
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              openAdmin(r.left + r.width / 2, r.top + r.height / 2, null);
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 text-lg font-bold"
            style={{
              background: adminOpen && !editCafe ? '#c4622d' : '#1a0f07',
              color: adminOpen && !editCafe ? '#f5efe6' : '#c4622d',
              border: '2px solid rgba(196,98,45,0.6)',
            }}
            aria-label="Add new place"
            title="Add new café or stall"
          >
            +
          </button>
        )}
      </div>


      {/* ── Desktop: profile backdrop ─────────────────────────── */}
      <div
        onClick={() => setProfileOpen(false)}
        className="hidden lg:block absolute inset-0 z-20 transition-all duration-300"
        style={{
          background: 'rgba(26,15,7,0.55)',
          backdropFilter: profileOpen ? 'blur(2px)' : 'none',
          WebkitBackdropFilter: profileOpen ? 'blur(2px)' : 'none',
          opacity: profileOpen ? 1 : 0,
          pointerEvents: profileOpen ? 'auto' : 'none',
        }}
      />

      {/* ── Desktop: profile panel — slides in from right ─────── */}
      <div
        className="hidden lg:flex absolute top-0 right-0 bottom-0 z-30 flex-col shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          width: 'min(50%, 480px)',
          background: '#1a0f07',
          borderLeft: '1px solid rgba(196,98,45,0.2)',
          transform: profileOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {user && (
          <ProfilePanel
            user={user}
            onClose={() => setProfileOpen(false)}
            onSignOut={() => { setProfileOpen(false); onSignOut?.(); }}
          />
        )}
      </div>

      {/* ── Mobile: circular clip-path reveal from top-right ──── */}
      {/* Origin matches the profile button centre: right-4 (16px) + w-10/2 (20px) = 36px from right, same from top */}
      <div
        className="lg:hidden absolute inset-0 z-30 overflow-y-auto"
        style={{
          background: '#1a0f07',
          clipPath: profileOpen
            ? 'circle(200% at calc(100% - 36px) 36px)'
            : 'circle(0% at calc(100% - 36px) 36px)',
          transition: 'clip-path 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: profileOpen ? 'auto' : 'none',
          willChange: 'clip-path',
        }}
      >
        {user && (
          <>
            {/* Back button */}
            <button
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2 px-5 pt-5 pb-2 text-sm font-semibold"
              style={{ color: 'rgba(245,239,230,0.55)' }}
              aria-label="Close profile"
            >
              <span className="text-base leading-none">←</span> Back
            </button>
            <ProfilePanel
              user={user}
              onClose={() => setProfileOpen(false)}
              onSignOut={() => { setProfileOpen(false); onSignOut?.(); }}
              hideHeader
            />
          </>
        )}
      </div>

      {/* ── Admin add / edit panel — circular fill from click origin */}
      <div
        ref={adminPanelRef}
        className="absolute inset-0 z-30 overflow-y-auto"
        style={{
          background: '#1a0f07',
          clipPath: adminOpen
            ? `circle(200% at ${adminOriginRef.current.x}px ${adminOriginRef.current.y}px)`
            : `circle(0% at ${adminOriginRef.current.x}px ${adminOriginRef.current.y}px)`,
          transition: 'clip-path 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: adminOpen ? 'auto' : 'none',
          willChange: 'clip-path',
        }}
      >
        {isAdmin && adminOpen && (
          <>
            {/* Back button — retraces the circle on click */}
            <button
              onClick={() => { setAdminOpen(false); setEditCafe(null); setPickMode(false); setPickedCoords(null); }}
              className="flex items-center gap-2 px-5 pt-5 pb-2 text-sm font-semibold shrink-0"
              style={{ color: 'rgba(245,239,230,0.55)' }}
              aria-label="Close panel"
            >
              <span className="text-base leading-none">←</span> Back
            </button>
            <AdminAddPanel
              key={editCafe?.id ?? 'new'}
              onClose={() => { setAdminOpen(false); setEditCafe(null); setPickMode(false); setPickedCoords(null); }}
              onPickModeChange={(active) => setPickMode(active)}
              pickedCoords={pickedCoords}
              onClearPick={() => setPickedCoords(null)}
              initialCafe={editCafe ?? undefined}
              hideHeader
            />
          </>
        )}
      </div>

      {/* Pick-mode toast — tells user to click map */}
      {pickMode && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-full text-sm font-semibold pointer-events-none"
          style={{
            background: '#1a0f07',
            color: '#c4622d',
            border: '1px solid rgba(196,98,45,0.5)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          📍 Click anywhere on the map to pin the location
        </div>
      )}

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
                <h2 className="font-display text-lg font-bold text-cream">{panelTitle}</h2>
                {panelView === 'list' && (
                  <p className="text-cream/40 text-xs mt-0.5">{filteredCafes.length} spots found</p>
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

          {/* Filter tabs — only show in list view */}
          {panelView === 'list' && (
            <FilterTabs active={filter} counts={counts} onChange={handleFilterChange} />
          )}

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto">
            {panelView === 'list' ? (
              <div className="p-4 flex flex-col gap-3">
                {filteredCafes.map((cafe, i) => (
                  <div key={cafe.id} ref={(el) => { cardRefs.current[cafe.id] = el; }}>
                    <PanelCard
                      cafe={cafe}
                      index={i}
                      isActive={activeCafeId === cafe.id}
                      onClick={() => selectCafe(cafe.id)}
                    />
                  </div>
                ))}
                {filteredCafes.length === 0 && (
                  <p className="text-cream/30 text-sm text-center py-8">Nothing here yet.</p>
                )}
              </div>
            ) : (
              activeCafe && (
                <PanelDetail
                  cafe={activeCafe}
                  onBack={goBackToList}
                  filterLabel={filterLabel}
                  isAdmin={isAdmin}
                  onEdit={(x, y) => openAdmin(x, y, activeCafe)}
                  onDelete={async () => { await deletePlace(activeCafe.id); goBackToList(); }}
                />
              )
            )}
          </div>
        </div>

        {/* Collapsed pill — re-open button */}
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-3 rounded-xl bg-espresso text-cream text-sm font-semibold shadow-xl hover:bg-espresso-light transition-all duration-200 border border-cream/10"
          >
            <span>{collapsedLabel}</span>
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
        <div
          className="absolute left-0 right-0 bottom-0 z-10 rounded-t-2xl shadow-2xl transition-all duration-500 ease-out flex flex-col overflow-hidden"
          style={{
            background: '#1a0f07',
            height: bottomSheet === 'expanded' ? '70vh' : '160px',
          }}
        >
          {/* Drag handle bar */}
          <div
            className="flex flex-col items-center pt-3 pb-1 shrink-0 cursor-pointer"
            onClick={() =>
              setBottomSheet((s) => (s === 'peek' ? 'expanded' : 'peek'))
            }
          >
            <div className="w-10 h-1 rounded-full bg-cream/20 mb-2" />
            <div className="flex items-center justify-between w-full px-5">
              <p className="text-cream text-sm font-semibold font-display">{bottomSheetSummary}</p>
              <span className="text-cream/40 text-xs">
                {bottomSheet === 'peek' ? '↑ expand' : '↓ collapse'}
              </span>
            </div>
          </div>

          {/* Filter tabs — show in peek + list view */}
          {panelView === 'list' && (
            <FilterTabs active={filter} counts={counts} onChange={handleFilterChange} />
          )}

          {/* Sheet body */}
          <div className="flex-1 overflow-y-auto">
            {panelView === 'list' ? (
              <div className="px-4 pb-4 flex flex-col gap-3">
                {filteredCafes.map((cafe, i) => (
                  <div key={cafe.id}>
                    <PanelCard
                      cafe={cafe}
                      index={i}
                      isActive={activeCafeId === cafe.id}
                      onClick={() => selectCafe(cafe.id)}
                    />
                  </div>
                ))}
                {filteredCafes.length === 0 && (
                  <p className="text-cream/30 text-sm text-center py-8">Nothing here yet.</p>
                )}
              </div>
            ) : (
              activeCafe && (
                <PanelDetail
                  cafe={activeCafe}
                  onBack={goBackToList}
                  filterLabel={filterLabel}
                  isAdmin={isAdmin}
                  onEdit={(x, y) => openAdmin(x, y, activeCafe)}
                  onDelete={async () => { await deletePlace(activeCafe.id); goBackToList(); }}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Attribution nudge ─────────────────────────────────── */}
      <div className="absolute bottom-2 right-2 z-10 text-[10px] text-espresso/40 pointer-events-none">
        © OpenStreetMap contributors
      </div>
    </section>
  );
}
