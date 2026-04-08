'use client';

import { useEffect, useRef } from 'react';
import { motion, Easing } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRouter } from 'next/navigation';
import { Cafe } from '@/types/cafe';

gsap.registerPlugin(ScrollTrigger);

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

const easeOut: Easing = 'easeOut';
const easeIn: Easing = 'easeIn';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: easeOut } },
};

const pageVariants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.45, ease: easeOut } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.3, ease: easeIn } },
};

interface CafeDetailClientProps {
  cafe: Cafe;
}

export default function CafeDetailClient({ cafe }: CafeDetailClientProps) {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInnerRef = useRef<HTMLDivElement>(null);

  const isStall = cafe.type === 'stall';
  const gradients = isStall ? STALL_GRADIENTS : CAFE_GRADIENTS;
  const accent = isStall ? '#d4952a' : '#c4622d';
  const accentBg = isStall ? '#0e1e10' : '#1a0f07';
  const emoji = isStall ? '🍜' : '☕';
  const typeLabel = isStall ? 'Street Stall' : 'Café';
  const backLabel = isStall ? 'Back to all stalls' : 'Back to all cafés';

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !heroRef.current || !heroInnerRef.current) return;

    gsap.to(heroInnerRef.current, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-cream"
    >
      {/* Back button */}
      <div className="fixed top-5 left-5 z-50">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-cream text-sm font-medium backdrop-blur-sm transition-colors shadow-lg"
          style={{ background: `${accentBg}e6` }}
        >
          ← Back
        </button>
      </div>

      {/* Parallax hero */}
      <div ref={heroRef} className="relative h-[65vh] min-h-[400px] overflow-hidden">
        <div
          ref={heroInnerRef}
          className="absolute inset-0 w-full h-[130%] -top-[15%] flex items-center justify-center"
          style={{ background: gradients[0] }}
        >
          <div className="text-[8rem] opacity-20 select-none">{emoji}</div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/30 to-transparent" />

        <div className="absolute bottom-8 left-6 md:left-12">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-widest border"
              style={{ borderColor: `${accent}99`, color: accent }}
            >
              {cafe.neighborhood}
            </span>
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ background: `${accentBg}cc`, color: accent, border: `1px solid ${accent}55` }}
            >
              {typeLabel}
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-cream leading-tight drop-shadow-lg">
            {cafe.name}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-12">
        {/* Info block */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap gap-4 mb-10"
        >
          <motion.div
            variants={itemVariants}
            className="flex-1 min-w-[200px] bg-cream-dark rounded-2xl p-5"
          >
            <p className="text-espresso/50 text-xs uppercase tracking-widest mb-1">Hours</p>
            <p className="font-medium text-espresso">{cafe.hours}</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex-1 min-w-[200px] bg-cream-dark rounded-2xl p-5"
          >
            <p className="text-espresso/50 text-xs uppercase tracking-widest mb-1">Location</p>
            <p className="font-medium text-espresso">{cafe.neighborhood}, Rawang</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex-1 min-w-[200px] bg-cream-dark rounded-2xl p-5"
          >
            <p className="text-espresso/50 text-xs uppercase tracking-widest mb-2">Vibe</p>
            <div className="flex flex-wrap gap-1.5">
              {cafe.vibeTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-0.5 rounded-full text-xs font-semibold"
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
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.6 } }}
          className="font-display text-2xl md:text-3xl italic text-espresso/70 mb-10 leading-relaxed"
        >
          &ldquo;{cafe.tagline}&rdquo;
        </motion.p>

        {/* Photo gallery horizontal scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.4, duration: 0.7 } }}
          className="mb-12"
        >
          <h2 className="font-display text-2xl font-semibold text-espresso mb-5">Gallery</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 gallery-scroll snap-x snap-mandatory">
            {cafe.photos.map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-72 h-52 rounded-xl overflow-hidden snap-start"
                style={{ background: gradients[i % gradients.length] }}
              >
                <div className="w-full h-full flex items-center justify-center text-5xl opacity-25">
                  {emoji}
                </div>
              </div>
            ))}
          </div>
          <p className="text-espresso/40 text-xs mt-2 italic">
            Photos coming soon — drop JPEGs into /public/images/{isStall ? 'stalls' : 'cafes'}/
          </p>
        </motion.div>

        {/* Blog write-up */}
        <motion.article
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.7 } }}
          className="prose prose-lg max-w-none"
        >
          <h2 className="font-display text-3xl font-bold text-espresso mb-6">
            Our Honest Take
          </h2>
          <div className="text-espresso/75 leading-relaxed space-y-5 text-base md:text-lg">
            <p>{cafe.description}</p>
            {isStall ? (
              <>
                <p>
                  Whether you&rsquo;re a Rawang local or just cruising through late at night,{' '}
                  <strong className="text-espresso font-semibold">{cafe.name}</strong> is the kind
                  of street stall that reminds you why simple, honest food hits harder than anything
                  off a fancy menu. No frills, no reservations — just show up, grab a seat, and
                  let the wok do the talking.
                </p>
                <p>
                  We stumbled in past 10 PM on a weeknight and ended up staying for two rounds.
                  Next visit: come hungry, and definitely try the soup version.
                </p>
              </>
            ) : (
              <>
                <p>
                  Whether you&rsquo;re a Rawang local or just passing through on your way up north,{' '}
                  <strong className="text-espresso font-semibold">{cafe.name}</strong> is the kind of
                  place that earns a spot on your regular rotation. It&rsquo;s not trying to be
                  Instagram-perfect (though it often is); it&rsquo;s just doing what a great café
                  does — making you feel like you belong.
                </p>
                <p>
                  We visited on a quiet Tuesday afternoon and left wishing we&rsquo;d given ourselves
                  more time. Next visit: bring a book, order two drinks, and settle in.
                </p>
              </>
            )}
          </div>
        </motion.article>

        {/* Map embed hint */}
        <div
          className="mt-12 p-6 rounded-2xl text-cream flex flex-col md:flex-row items-start md:items-center gap-4"
          style={{ background: accentBg }}
        >
          <div className="text-3xl">📍</div>
          <div>
            <p className="font-semibold mb-0.5">{cafe.name}</p>
            <p className="text-cream/60 text-sm">
              {cafe.neighborhood}, Rawang, Selangor — {cafe.lat.toFixed(4)},{' '}
              {cafe.lng.toFixed(4)}
            </p>
          </div>
          <a
            href={`https://www.openstreetmap.org/?mlat=${cafe.lat}&mlon=${cafe.lng}#map=17/${cafe.lat}/${cafe.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="md:ml-auto flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-cream"
            style={{ background: accent }}
          >
            Open in maps →
          </a>
        </div>

        {/* Back link */}
        <div className="mt-12 text-center">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 font-semibold hover:gap-3 transition-all duration-200"
            style={{ color: accent }}
          >
            ← {backLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
