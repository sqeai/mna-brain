'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

// Cosmic palette from reference: deep blue space, cyan atmospheric glow, small stars
const DARK = {
  BG_START: 'rgba(26, 42, 58, 0.98)',   // #1a2a3a - deep blue
  BG_MID: 'rgba(40, 64, 80, 0.97)',     // #284050 - muted teal-blue
  BG_END: 'rgba(32, 48, 64, 0.98)',     // #203040
  GLOW_COLOR: 'rgba(128, 255, 255, 0.35)',   // cyan atmospheric
  GLOW_INNER: 'rgba(176, 255, 255, 0.12)',
  STAR: 'rgba(240, 248, 255, 0.95)',    // #F0F8FF
  STAR_DIM: 'rgba(224, 240, 255, 0.6)',
  STAR_TWINKLE: 'rgba(255, 255, 255, 1)',
} as const;

const LIGHT = {
  BG_START: 'rgba(248, 252, 255, 0.98)',   // very light blue-white
  BG_MID: 'rgba(240, 248, 252, 0.97)',     // #f0f8fc
  BG_END: 'rgba(250, 252, 255, 0.98)',
  GLOW_COLOR: 'rgba(64, 140, 160, 0.18)',  // subtle teal/cyan
  GLOW_INNER: 'rgba(80, 160, 180, 0.08)',
  STAR: 'rgba(60, 100, 120, 0.7)',         // darker points for contrast
  STAR_DIM: 'rgba(80, 120, 140, 0.45)',
  STAR_TWINKLE: 'rgba(40, 90, 110, 0.85)',
} as const;

const STAR_COUNT = 120;
const STAR_SIZE_MIN = 0.4;
const STAR_SIZE_MAX = 1.2;

function useStars(viewWidth: number, viewHeight: number) {
  return useMemo(() => {
    const stars: { x: number; y: number; r: number; delay: number; duration: number }[] = [];
    const rng = (seed: number) => {
      const x = Math.sin(seed * 9999) * 10000;
      return x - Math.floor(x);
    };
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: rng(i + 1) * viewWidth,
        y: rng(i + 2) * viewHeight,
        r: STAR_SIZE_MIN + rng(i + 3) * (STAR_SIZE_MAX - STAR_SIZE_MIN),
        delay: rng(i + 4) * 4,
        duration: 2 + rng(i + 5) * 2,
      });
    }
    return stars;
  }, [viewWidth, viewHeight]);
}

export function LivingBackground() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const c = isDark ? DARK : LIGHT;

  const viewWidth = 1000;
  const viewHeight = 800;
  const stars = useStars(viewWidth, viewHeight);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden
    >
      {/* Base gradient - light (cosmic light blue / off-white) */}
      <div
        className="absolute inset-0 dark:opacity-0 transition-opacity duration-300"
        style={{
          background: `linear-gradient(160deg, ${LIGHT.BG_START} 0%, ${LIGHT.BG_MID} 50%, ${LIGHT.BG_END} 100%)`,
        }}
      />
      {/* Base gradient - dark (deep blue space) */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(160deg, ${DARK.BG_START} 0%, ${DARK.BG_MID} 50%, ${DARK.BG_END} 100%)`,
        }}
      />

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 1 }}
      >
        <defs>
          {/* Atmospheric glow: soft curved band (like Earth's limb glow) */}
          <radialGradient id="atmoGlow" cx="20%" cy="50%" r="70%" fx="15%" fy="50%">
            <stop offset="0%" stopColor={c.GLOW_INNER} />
            <stop offset="45%" stopColor={c.GLOW_COLOR} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          {/* Horizontal streak of glow for subtle depth */}
          <linearGradient id="atmoGlowStrip" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="25%" stopColor={c.GLOW_COLOR} />
            <stop offset="50%" stopColor={c.GLOW_INNER} />
            <stop offset="75%" stopColor={c.GLOW_COLOR} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <filter id="glowBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Atmospheric glow band - curved soft band on the left third */}
        <ellipse
          cx={viewWidth * 0.22}
          cy={viewHeight * 0.5}
          rx={viewWidth * 0.35}
          ry={viewHeight * 0.7}
          fill="url(#atmoGlow)"
          filter="url(#glowBlur)"
          style={{ opacity: isDark ? 0.9 : 0.85 }}
        />
        {/* Subtle horizontal glow streak */}
        <rect
          x={0}
          y={viewHeight * 0.35}
          width={viewWidth}
          height={viewHeight * 0.3}
          fill="url(#atmoGlowStrip)"
          opacity={isDark ? 0.2 : 0.15}
        />

        {/* Starfield: small scattered points with gentle twinkle */}
        <g fill={c.STAR}>
          {stars.map((star, i) => (
            <motion.circle
              key={`star-${i}`}
              cx={star.x}
              cy={star.y}
              r={star.r}
              fill={c.STAR}
              initial={{ opacity: 0.6 }}
              animate={{
                opacity: [0.6, 1, 0.7, 0.6],
              }}
              transition={{
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </g>
      </svg>

      {/* Subtle noise - lighter in light mode, very subtle in dark */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
}
