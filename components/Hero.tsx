'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface HeroProps {
  onScrollToMap: () => void;
}

export default function Hero({ onScrollToMap }: HeroProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (decorRef.current) {
      gsap.set(decorRef.current.children, { opacity: 0, scale: 0.6 });
    }

    const words = titleRef.current?.querySelectorAll('span') ?? [];
    gsap.set(words, { y: 60, opacity: 0 });

    tl.to(words, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.12,
    })
      .fromTo(
        subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        '-=0.3'
      )
      .fromTo(
        ctaRef.current,
        { y: 20, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5 },
        '-=0.2'
      )
      .to(
        decorRef.current?.children ?? [],
        { opacity: 1, scale: 1, stagger: 0.1, duration: 0.6, ease: 'back.out(1.4)' },
        '-=0.3'
      );
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #1a0f07 0%, #2d1a0e 50%, #1a1a0f 100%)' }}
    >
      {/* Decorative floating elements */}
      <div ref={decorRef} className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <span className="absolute top-[15%] left-[8%] text-6xl opacity-10">☕</span>
        <span className="absolute top-[70%] left-[5%] text-4xl opacity-10">🌿</span>
        <span className="absolute top-[20%] right-[10%] text-5xl opacity-10">☕</span>
        <span className="absolute top-[60%] right-[8%] text-3xl opacity-10">🍃</span>
        <span className="absolute top-[40%] left-[50%] text-7xl opacity-5">☕</span>
      </div>

      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Pre-title label */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-terracotta/40 text-terracotta text-sm font-medium tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
          Rawang · Selangor
        </div>

        {/* Main title with per-word spans for GSAP stagger */}
        <h1
          ref={titleRef}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-cream leading-tight mb-6 overflow-hidden"
        >
          {'Cafes Around Rawang'.split(' ').map((word, i) => (
            <span key={i} className="inline-block mr-4">
              {word}
            </span>
          ))}
        </h1>

        <p
          ref={subtitleRef}
          className="text-cream/60 text-lg md:text-2xl font-light mb-10 max-w-lg mx-auto leading-relaxed"
        >
          Hidden gems in{' '}
          <span className="text-terracotta font-medium">Bukit Sentosa</span> &amp; beyond
        </p>

        <button
          ref={ctaRef}
          onClick={onScrollToMap}
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-terracotta text-cream font-semibold text-base rounded-full hover:bg-terracotta/80 transition-all duration-300 hover:gap-4 hover:shadow-lg hover:shadow-terracotta/30"
        >
          Explore the map
          <span className="transition-transform duration-300 group-hover:translate-x-1">↓</span>
        </button>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cream/30 text-xs uppercase tracking-widest">
        <span>Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-cream/30 to-transparent" />
      </div>
    </section>
  );
}
