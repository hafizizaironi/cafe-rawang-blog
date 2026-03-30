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
  const labelRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const words = titleRef.current?.querySelectorAll('span') ?? [];
    gsap.set(words, { y: 50, opacity: 0 });
    gsap.set([labelRef.current, subtitleRef.current, ctaRef.current, scrollHintRef.current], {
      y: 20,
      opacity: 0,
    });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to(labelRef.current, { y: 0, opacity: 1, duration: 0.6 })
      .to(words, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, '-=0.3')
      .to(subtitleRef.current, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4')
      .to(ctaRef.current, { y: 0, opacity: 1, duration: 0.5 }, '-=0.3')
      .to(scrollHintRef.current, { y: 0, opacity: 1, duration: 0.5 }, '-=0.2');
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #3b2110 0%, #5c3317 60%, #7a4a24 100%)' }}
    >
      {/* Subtle radial glow at center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(196,98,45,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* Location label */}
        <div
          ref={labelRef}
          className="mb-8 inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase"
          style={{ color: 'rgba(245,239,230,0.45)' }}
        >
          <span className="w-6 h-px bg-current" />
          Rawang · Selangor
          <span className="w-6 h-px bg-current" />
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          className="font-display font-bold leading-tight mb-6 overflow-hidden"
          style={{
            fontSize: 'clamp(2.8rem, 8vw, 6rem)',
            color: '#f5efe6',
            letterSpacing: '-0.01em',
          }}
        >
          {'Cafes Around Rawang'.split(' ').map((word, i) => (
            <span key={i} className="inline-block mr-[0.3em] last:mr-0">
              {word}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="font-sans font-light mb-10 max-w-sm mx-auto leading-relaxed"
          style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
            color: 'rgba(245,239,230,0.5)',
          }}
        >
          Hidden gems in Bukit Sentosa &amp; beyond
        </p>

        {/* CTA */}
        <button
          ref={ctaRef}
          onClick={onScrollToMap}
          className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full font-sans font-semibold text-sm tracking-wide border transition-all duration-300 hover:bg-white/10"
          style={{
            color: '#f5efe6',
            borderColor: 'rgba(245,239,230,0.35)',
            background: 'rgba(245,239,230,0.08)',
          }}
        >
          Explore the map
          <span className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
        </button>
      </div>

      {/* Scroll hint */}
      <div
        ref={scrollHintRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 cursor-pointer"
        onClick={onScrollToMap}
      >
        <div
          className="w-px h-10 animate-pulse"
          style={{ background: 'linear-gradient(to bottom, rgba(245,239,230,0.3), transparent)' }}
        />
      </div>
    </section>
  );
}
