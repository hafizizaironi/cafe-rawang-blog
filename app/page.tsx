'use client';

import { useState, useEffect } from 'react';
import MapSection from '@/components/MapSection';
import AuthModal from '@/components/AuthModal';
import {
  auth,
  onAuthStateChanged,
  type User,
} from '@/lib/firebase';

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    /*
      Fallback: if Firebase isn't configured yet (placeholder keys) or is
      slow to respond, stop showing the loading screen after 2 s and let
      the auth modal appear so the user isn't stuck on a blank page.
    */
    const fallback = setTimeout(() => setChecking(false), 2000);

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        clearTimeout(fallback);
        setUser(firebaseUser);
        setChecking(false);
      });
    } catch {
      clearTimeout(fallback);
      setChecking(false);
    }

    return () => {
      clearTimeout(fallback);
      unsubscribe?.();
    };
  }, []);

  if (checking) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: '#1a0f07' }}
      >
        <span className="text-5xl animate-pulse select-none">☕</span>
      </div>
    );
  }

  return (
    <main className="h-screen overflow-hidden">
      <MapSection
        user={user}
        isAdmin={!!(user && ADMIN_UID && user.uid === ADMIN_UID)}
        onSignOut={() => setUser(null)}
      />
      {!user && <AuthModal onAuthenticated={setUser} />}
    </main>
  );
}
