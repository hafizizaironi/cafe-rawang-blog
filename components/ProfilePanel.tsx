'use client';

import { useState } from 'react';
import { auth, signOut, type User } from '@/lib/firebase';

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

interface ProfilePanelProps {
  user: User;
  onClose: () => void;
  onSignOut: () => void;
  hideHeader?: boolean;
}

export default function ProfilePanel({ user, onClose, onSignOut, hideHeader }: ProfilePanelProps) {
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user.displayName ?? user.email?.split('@')[0] ?? 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
      onSignOut();
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header — hidden on mobile (replaced by the back button in MapSection) */}
      {!hideHeader && (
        <div
          className="shrink-0 flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(196,98,45,0.15)' }}
        >
          <h2 className="font-display text-lg font-bold" style={{ color: '#f5efe6' }}>
            My Profile
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
            style={{ background: 'rgba(245,239,230,0.1)', color: 'rgba(245,239,230,0.6)' }}
            aria-label="Close profile"
          >
            ✕
          </button>
        </div>
      )}

      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 px-6 py-8">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={displayName}
            className="w-20 h-20 rounded-full object-cover"
            style={{ border: '3px solid #c4622d', boxShadow: '0 0 0 4px rgba(196,98,45,0.15)' }}
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold font-display"
            style={{
              background: 'linear-gradient(135deg, #c4622d 0%, #7a4a24 100%)',
              color: '#f5efe6',
              boxShadow: '0 0 0 4px rgba(196,98,45,0.15)',
            }}
          >
            {initials}
          </div>
        )}

        <div className="text-center">
          <p className="font-display font-bold text-xl" style={{ color: '#f5efe6' }}>
            {displayName}
          </p>
          {user.email && (
            <p className="text-sm mt-0.5" style={{ color: 'rgba(245,239,230,0.45)' }}>
              {user.email}
            </p>
          )}
        </div>

        {/* Auth provider badge */}
        <span
          className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{
            background: 'rgba(196,98,45,0.12)',
            color: '#c4622d',
            border: '1px solid rgba(196,98,45,0.3)',
          }}
        >
          {user.providerData[0]?.providerId === 'google.com' ? '🔐 Google account' : '📧 Email account'}
        </span>
      </div>

      {/* Divider */}
      <div className="mx-6" style={{ height: 1, background: 'rgba(196,98,45,0.12)' }} />

      {/* Stats row (placeholder) */}
      <div className="grid grid-cols-2 gap-3 px-6 py-6">
        {[
          { label: 'Cafés visited', value: '—' },
          { label: 'Favourites', value: '—' },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center py-4 rounded-xl gap-1"
            style={{ background: 'rgba(245,239,230,0.04)', border: '1px solid rgba(196,98,45,0.12)' }}
          >
            <span className="font-display font-bold text-2xl" style={{ color: '#f5efe6' }}>
              {value}
            </span>
            <span className="text-[11px] font-medium text-center" style={{ color: 'rgba(245,239,230,0.4)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-6" style={{ height: 1, background: 'rgba(196,98,45,0.12)' }} />

      {/* Account info rows */}
      <div className="px-6 py-5 flex flex-col gap-3">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'rgba(245,239,230,0.3)' }}
        >
          Account
        </p>

        {/* Email verified */}
        <div
          className="flex items-center justify-between py-3 px-4 rounded-xl"
          style={{ background: 'rgba(245,239,230,0.04)', border: '1px solid rgba(196,98,45,0.1)' }}
        >
          <span className="text-sm font-sans" style={{ color: 'rgba(245,239,230,0.6)' }}>
            Email verified
          </span>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: user.emailVerified ? 'rgba(106,170,106,0.15)' : 'rgba(196,98,45,0.15)',
              color: user.emailVerified ? '#6aaa6a' : '#c4622d',
            }}
          >
            {user.emailVerified ? 'Verified' : 'Not verified'}
          </span>
        </div>

        {/* Admin badge */}
        {ADMIN_UID && user.uid === ADMIN_UID && (
          <div
            className="flex items-center justify-between py-3 px-4 rounded-xl"
            style={{ background: 'rgba(196,98,45,0.08)', border: '1px solid rgba(196,98,45,0.3)' }}
          >
            <span className="text-sm font-sans" style={{ color: 'rgba(245,239,230,0.6)' }}>
              Role
            </span>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: '#c4622d', color: '#f5efe6' }}
            >
              ★ Admin
            </span>
          </div>
        )}

        {/* UID — copy to set as admin */}
        <UidRow uid={user.uid} />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sign out */}
      <div className="px-6 pb-8 shrink-0">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-3 rounded-xl text-sm font-semibold font-sans transition-all duration-200 hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
          style={{
            background: 'rgba(196,98,45,0.12)',
            color: '#c4622d',
            border: '1px solid rgba(196,98,45,0.3)',
          }}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}

/* ── Copyable UID row ───────────────────────────────────────── */
function UidRow({ uid }: { uid: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(uid).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div
      className="flex items-center justify-between py-3 px-4 rounded-xl gap-3"
      style={{ background: 'rgba(245,239,230,0.04)', border: '1px solid rgba(196,98,45,0.1)' }}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(245,239,230,0.3)' }}>
          User ID
        </span>
        <span className="text-xs font-mono truncate" style={{ color: 'rgba(245,239,230,0.45)' }}>
          {uid}
        </span>
      </div>
      <button
        onClick={copy}
        className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all"
        style={{
          background: copied ? 'rgba(106,170,106,0.15)' : 'rgba(245,239,230,0.08)',
          color: copied ? '#6aaa6a' : 'rgba(245,239,230,0.4)',
          border: '1px solid rgba(245,239,230,0.1)',
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
