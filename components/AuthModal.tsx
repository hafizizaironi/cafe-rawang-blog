'use client';

import { useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
} from '@/lib/firebase';

interface AuthModalProps {
  onAuthenticated: (user: User) => void;
}

type Mode = 'login' | 'signup';

export default function AuthModal({ onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay so the mount animation plays
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const clearError = () => setError('');

  const handleGoogleSignIn = async () => {
    clearError();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onAuthenticated(result.user);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (mode === 'signup' && name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        onAuthenticated(result.user);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        onAuthenticated(result.user);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{
        background: 'rgba(26, 15, 7, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        transition: 'opacity 0.4s ease',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        style={{
          background: '#1a0f07',
          border: '1px solid rgba(196,98,45,0.25)',
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Header */}
        <div
          className="px-7 pt-8 pb-5 text-center"
          style={{ borderBottom: '1px solid rgba(196,98,45,0.15)' }}
        >
          <span className="text-3xl select-none">☕</span>
          <h1 className="font-display font-bold text-xl mt-2" style={{ color: '#f5efe6' }}>
            Cafés Around Rawang
          </h1>
          <p className="text-xs mt-1.5 font-sans" style={{ color: 'rgba(245,239,230,0.45)' }}>
            {mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create an account to get started.'}
          </p>
        </div>

        {/* Body */}
        <div className="px-7 py-6 flex flex-col gap-4">

          {/* Google button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-semibold font-sans transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{
              background: '#f5efe6',
              color: '#1a0f07',
              border: '1px solid rgba(196,98,45,0.2)',
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(245,239,230,0.1)' }} />
            <span className="text-xs font-sans" style={{ color: 'rgba(245,239,230,0.3)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(245,239,230,0.1)' }} />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => { setName(e.target.value); clearError(); }}
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm font-sans outline-none transition-all duration-200"
                style={{
                  background: 'rgba(245,239,230,0.06)',
                  border: '1px solid rgba(196,98,45,0.25)',
                  color: '#f5efe6',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(196,98,45,0.7)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(196,98,45,0.25)')}
              />
            )}

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm font-sans outline-none transition-all duration-200"
              style={{
                background: 'rgba(245,239,230,0.06)',
                border: '1px solid rgba(196,98,45,0.25)',
                color: '#f5efe6',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(196,98,45,0.7)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(196,98,45,0.25)')}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm font-sans outline-none transition-all duration-200"
              style={{
                background: 'rgba(245,239,230,0.06)',
                border: '1px solid rgba(196,98,45,0.25)',
                color: '#f5efe6',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(196,98,45,0.7)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(196,98,45,0.25)')}
            />

            {/* Error */}
            {error && (
              <p className="text-xs font-sans px-1" style={{ color: '#e07a5f' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold font-sans transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: '#c4622d', color: '#f5efe6' }}
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-xs font-sans" style={{ color: 'rgba(245,239,230,0.4)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); clearError(); }}
              className="font-semibold underline underline-offset-2 hover:opacity-80"
              style={{ color: '#c4622d' }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Inline Google icon so no extra dependency needed ───────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908C16.658 14.121 17.64 11.834 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function getErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: string }).code;
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return '';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}
