'use client';

import { useState, useRef, useEffect } from 'react';
import { Cafe, PlaceType } from '@/types/cafe';
import { addPlace, updatePlace, uploadPlacePhoto } from '@/lib/firestore';

interface AdminAddPanelProps {
  onClose: () => void;
  onPickModeChange: (active: boolean) => void;
  pickedCoords: { lat: number; lng: number } | null;
  onClearPick: () => void;
  /** When provided the panel runs in edit mode */
  initialCafe?: Cafe;
  /** Hide the built-in header (used when a back button is rendered outside) */
  hideHeader?: boolean;
}

type FormData = {
  type: PlaceType;
  name: string;
  tagline: string;
  neighborhood: string;
  hours: string;
  description: string;
  vibeTags: string[];
  lat: string;
  lng: string;
};

const EMPTY: FormData = {
  type: 'cafe',
  name: '',
  tagline: '',
  neighborhood: '',
  hours: '',
  description: '',
  vibeTags: [],
  lat: '',
  lng: '',
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/* ── Shared input style ─────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 12,
  background: 'rgba(245,239,230,0.05)',
  border: '1px solid rgba(196,98,45,0.25)',
  color: '#f5efe6',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: 'rgba(245,239,230,0.4)' }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export default function AdminAddPanel({
  onClose,
  onPickModeChange,
  pickedCoords,
  onClearPick,
  initialCafe,
  hideHeader,
}: AdminAddPanelProps) {
  const isEdit = !!initialCafe;

  const [form, setForm] = useState<FormData>(() =>
    initialCafe
      ? {
          type: initialCafe.type,
          name: initialCafe.name,
          tagline: initialCafe.tagline,
          neighborhood: initialCafe.neighborhood,
          hours: initialCafe.hours,
          description: initialCafe.description,
          vibeTags: [...initialCafe.vibeTags],
          lat: String(initialCafe.lat),
          lng: String(initialCafe.lng),
        }
      : EMPTY
  );
  const [tagInput, setTagInput] = useState('');
  /* Existing photo URLs from Firestore — user can remove them */
  const [existingPhotos, setExistingPhotos] = useState<string[]>(initialCafe?.photos ?? []);
  /* Newly selected local files */
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [pickMode, setPickMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalPhotos = existingPhotos.length + photos.length;

  const set = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* Sync coords from map pick */
  useEffect(() => {
    if (pickedCoords) {
      setForm((prev) => ({
        ...prev,
        lat: pickedCoords.lat.toFixed(6),
        lng: pickedCoords.lng.toFixed(6),
      }));
      setPickMode(false);
      onPickModeChange(false);
    }
  }, [pickedCoords, onPickModeChange]);

  /* Notify parent of pick mode change */
  const togglePickMode = () => {
    const next = !pickMode;
    setPickMode(next);
    onPickModeChange(next);
    if (next) onClearPick();
  };

  /* Photo selection — respects 3-photo cap across existing + new */
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const remaining = 3 - totalPhotos;
    const files = Array.from(e.target.files ?? []).slice(0, remaining);
    setPhotos((prev) => [...prev, ...files]);
    files.forEach((file) => {
      setPreviews((prev) => [...prev, URL.createObjectURL(file)]);
    });
    e.target.value = '';
  };

  const removeExistingPhoto = (i: number) =>
    setExistingPhotos((prev) => prev.filter((_, idx) => idx !== i));

  const removeNewPhoto = (i: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  /* Submit — shared for add & edit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim())      { setError('Name is required.'); return; }
    if (!form.lat || !form.lng) { setError('Coordinates are required — pin on map or type manually.'); return; }
    if (isNaN(+form.lat) || isNaN(+form.lng)) { setError('Coordinates must be valid numbers.'); return; }

    setSubmitting(true);
    try {
      const slug = isEdit ? initialCafe!.slug : slugify(form.name);

      /* Upload any new photo files */
      const newPhotoUrls: string[] = [];
      for (const file of photos) {
        newPhotoUrls.push(await uploadPlacePhoto(file, slug));
      }

      const allPhotos = [...existingPhotos, ...newPhotoUrls];
      const payload = {
        type: form.type,
        name: form.name.trim(),
        slug,
        tagline: form.tagline.trim(),
        neighborhood: form.neighborhood.trim(),
        hours: form.hours.trim(),
        description: form.description.trim(),
        vibeTags: form.vibeTags,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        photos: allPhotos,
      };

      if (isEdit) {
        await updatePlace(initialCafe!.id, payload);
      } else {
        await addPlace(payload);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error(err);
      setError('Failed to save. Check Firebase rules and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const accent = form.type === 'stall' ? '#d4952a' : '#c4622d';
  const emoji  = form.type === 'stall' ? '🍜' : '☕';

  return (
    <div className="flex flex-col h-full">
      {/* Header — hidden when a back button is rendered outside */}
      {!hideHeader && (
        <div
          className="shrink-0 flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(196,98,45,0.15)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <h2 className="font-display text-lg font-bold" style={{ color: '#f5efe6' }}>
              {isEdit ? 'Edit Place' : 'Add New Place'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
            style={{ background: 'rgba(245,239,230,0.1)', color: 'rgba(245,239,230,0.6)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

        {/* Inline title when header is hidden */}
        {hideHeader && (
          <div className="flex items-center gap-2 pb-1">
            <span className="text-xl">{emoji}</span>
            <h2 className="font-display text-lg font-bold" style={{ color: '#f5efe6' }}>
              {isEdit ? 'Edit Place' : 'Add New Place'}
            </h2>
          </div>
        )}

        {/* Type toggle */}
        <Field label="Type">
          <div className="flex gap-2">
            {(['cafe', 'stall'] as PlaceType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: form.type === t ? accent : 'rgba(245,239,230,0.05)',
                  color: form.type === t ? '#f5efe6' : 'rgba(245,239,230,0.4)',
                  border: `1px solid ${form.type === t ? accent : 'rgba(245,239,230,0.1)'}`,
                }}
              >
                {t === 'cafe' ? '☕ Café' : '🍜 Street Stall'}
              </button>
            ))}
          </div>
        </Field>

        {/* Name */}
        <Field label="Name *">
          <input
            style={inputStyle}
            placeholder="e.g. Kopi Bukit Sentosa"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = accent)}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(196,98,45,0.25)')}
          />
        </Field>

        {/* Tagline */}
        <Field label="Tagline">
          <input
            style={inputStyle}
            placeholder="One-line description"
            value={form.tagline}
            onChange={(e) => set('tagline', e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = accent)}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(196,98,45,0.25)')}
          />
        </Field>

        {/* Neighborhood */}
        <Field label="Neighbourhood">
          <input
            style={inputStyle}
            placeholder="e.g. Bukit Sentosa"
            value={form.neighborhood}
            onChange={(e) => set('neighborhood', e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = accent)}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(196,98,45,0.25)')}
          />
        </Field>

        {/* Hours */}
        <Field label="Hours">
          <input
            style={inputStyle}
            placeholder="e.g. 7:00 AM – 5:00 PM (Closed Tue)"
            value={form.hours}
            onChange={(e) => set('hours', e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = accent)}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(196,98,45,0.25)')}
          />
        </Field>

        {/* Vibe tags */}
        <Field label="Vibe Tags">
          <div className="flex gap-2">
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Type & press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = accent)}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(196,98,45,0.25)')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const tag = tagInput.trim().toLowerCase();
                  if (tag && !form.vibeTags.includes(tag)) {
                    setForm((prev) => ({ ...prev, vibeTags: [...prev.vibeTags, tag] }));
                  }
                  setTagInput('');
                }
              }}
            />
          </div>
          {form.vibeTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {form.vibeTags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer"
                  style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}44` }}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, vibeTags: prev.vibeTags.filter((t) => t !== tag) }))
                  }
                >
                  {tag} <span style={{ opacity: 0.6 }}>×</span>
                </span>
              ))}
            </div>
          )}
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
            placeholder="Tell the story of this place…"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = accent)}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(196,98,45,0.25)')}
          />
        </Field>

        {/* Coordinates */}
        <Field label="Coordinates *">
          <div className="flex gap-2">
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Latitude"
              value={form.lat}
              onChange={(e) => set('lat', e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = accent)}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(196,98,45,0.25)')}
            />
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Longitude"
              value={form.lng}
              onChange={(e) => set('lng', e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = accent)}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(196,98,45,0.25)')}
            />
          </div>
          <button
            type="button"
            onClick={togglePickMode}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 mt-1"
            style={{
              background: pickMode ? accent : 'rgba(245,239,230,0.06)',
              color: pickMode ? '#f5efe6' : 'rgba(245,239,230,0.5)',
              border: `1px solid ${pickMode ? accent : 'rgba(245,239,230,0.12)'}`,
              animation: pickMode ? 'coordPulse 1.5s ease-in-out infinite' : 'none',
            }}
          >
            {pickMode ? '📍 Click on the map to pin location…' : '🗺 Pin on map'}
          </button>
          {form.lat && form.lng && (
            <p className="text-[11px] text-center" style={{ color: 'rgba(245,239,230,0.35)' }}>
              {parseFloat(form.lat).toFixed(5)}, {parseFloat(form.lng).toFixed(5)}
            </p>
          )}
        </Field>

        {/* Photos */}
        <Field label={`Photos (${totalPhotos}/3)`}>
          <div className="flex gap-2 flex-wrap">
            {/* Existing Firestore photo URLs */}
            {existingPhotos.map((src, i) => (
              <div key={`ex-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden" style={{ border: `2px solid ${accent}55` }}>
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingPhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                  style={{ background: 'rgba(26,15,7,0.8)', color: '#f5efe6' }}
                >
                  ✕
                </button>
              </div>
            ))}
            {/* Newly selected local previews */}
            {previews.map((src, i) => (
              <div key={`new-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden" style={{ border: `2px solid ${accent}55` }}>
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewPhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                  style={{ background: 'rgba(26,15,7,0.8)', color: '#f5efe6' }}
                >
                  ✕
                </button>
              </div>
            ))}
            {totalPhotos < 3 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 text-xs transition-all hover:opacity-80"
                style={{
                  border: `2px dashed ${accent}55`,
                  color: 'rgba(245,239,230,0.35)',
                  background: 'rgba(245,239,230,0.03)',
                }}
              >
                <span className="text-xl">+</span>
                <span>Photo</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </Field>

        {/* Error */}
        {error && (
          <p className="text-xs px-1" style={{ color: '#e07a5f' }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || success}
          className="w-full py-3 rounded-xl text-sm font-semibold font-sans transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 mt-1"
          style={{ background: success ? '#6aaa6a' : accent, color: '#f5efe6' }}
        >
          {success ? '✓ Saved!' : submitting ? 'Saving…' : isEdit ? 'Save Changes' : `Add ${form.type === 'stall' ? 'Stall' : 'Café'}`}
        </button>

        <div className="pb-4" />
      </form>

      <style>{`
        @keyframes coordPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.65; }
        }
      `}</style>
    </div>
  );
}
