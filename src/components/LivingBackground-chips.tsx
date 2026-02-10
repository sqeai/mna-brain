'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

// Cosmic palette: deep blue space, cyan atmospheric glow, star whites
const DARK = {
  BG_START: '#1a2a3a',
  BG_MID: '#284050',
  BG_END: '#203040',
  GLOW_COLOR: 'rgba(128, 255, 255, 0.35)',
  GLOW_INNER: 'rgba(176, 255, 255, 0.12)',
  STAR: '#f0f8ff',
  STAR_DIM: '#e0f0ff',
  STAR_TWINKLE: '#ffffff',
  // Circuit adaptation (cyan / star)
  CIRCUIT: '#80ffff',
  CIRCUIT_BRIGHT: '#e0f0ff',
  CHIP_BG: '#0a1a2a',
  CHIP_DIE: '#0d2438',
  CHIP_INNER: '#0f2a40',
} as const;

const LIGHT = {
  BG_START: '#f8fcff',
  BG_MID: '#f0f8fc',
  BG_END: '#fafcff',
  GLOW_COLOR: 'rgba(64, 140, 160, 0.18)',
  GLOW_INNER: 'rgba(80, 160, 180, 0.08)',
  STAR: '#3c6478',
  STAR_DIM: '#50788c',
  STAR_TWINKLE: '#285a6e',
  // Circuit adaptation (teal / muted)
  CIRCUIT: '#3c6478',
  CIRCUIT_BRIGHT: '#508c9e',
  CHIP_BG: '#e0ecf2',
  CHIP_DIE: '#d0e0e8',
  CHIP_INNER: '#b8d4e0',
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

interface LivingBackgroundProps {
  isTransitioning?: boolean;
}

export function LivingBackground({ isTransitioning = false }: LivingBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const c = isDark ? DARK : LIGHT;

  const viewWidth = 1000;
  const viewHeight = 800;
  const stars = useStars(viewWidth, viewHeight);

  return (
    <div
      className={cn(
        'fixed inset-0 z-0 pointer-events-none overflow-hidden transition-all duration-700 motion-reduce:transition-none',
        isTransitioning && 'scale-110 blur-xl opacity-0'
      )}
      aria-hidden
    >
      {/* Background gradient - Star cosmic palette */}
      <div
        className="absolute inset-0 dark:opacity-0 transition-opacity duration-300"
        style={{
          background: `linear-gradient(160deg, ${LIGHT.BG_START} 0%, ${LIGHT.BG_MID} 50%, ${LIGHT.BG_END} 100%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(160deg, ${DARK.BG_START} 0%, ${DARK.BG_MID} 50%, ${DARK.BG_END} 100%)`,
        }}
      />

      {/* Circuit board SVG pattern - Star color scheme */}
      <svg
        className="absolute inset-0 w-full h-full opacity-50 dark:opacity-50 transition-opacity duration-300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="circuitPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <line x1="0" y1="20" x2="30" y2="20" stroke={c.CIRCUIT} strokeWidth="1.5" opacity="0.6" />
            <line x1="50" y1="20" x2="80" y2="20" stroke={c.CIRCUIT} strokeWidth="1.5" opacity="0.6" />
            <line x1="0" y1="40" x2="25" y2="40" stroke={c.CIRCUIT} strokeWidth="1" opacity="0.5" />
            <line x1="55" y1="40" x2="80" y2="40" stroke={c.CIRCUIT} strokeWidth="1" opacity="0.5" />
            <line x1="0" y1="60" x2="35" y2="60" stroke={c.CIRCUIT} strokeWidth="1.5" opacity="0.6" />
            <line x1="45" y1="60" x2="80" y2="60" stroke={c.CIRCUIT} strokeWidth="1.5" opacity="0.6" />
            <line x1="20" y1="0" x2="20" y2="30" stroke={c.CIRCUIT} strokeWidth="1.5" opacity="0.6" />
            <line x1="20" y1="50" x2="20" y2="80" stroke={c.CIRCUIT} strokeWidth="1.5" opacity="0.6" />
            <line x1="40" y1="0" x2="40" y2="25" stroke={c.CIRCUIT} strokeWidth="1" opacity="0.5" />
            <line x1="40" y1="55" x2="40" y2="80" stroke={c.CIRCUIT} strokeWidth="1" opacity="0.5" />
            <line x1="60" y1="0" x2="60" y2="35" stroke={c.CIRCUIT} strokeWidth="1.5" opacity="0.6" />
            <line x1="60" y1="45" x2="60" y2="80" stroke={c.CIRCUIT} strokeWidth="1.5" opacity="0.6" />
            <line x1="30" y1="20" x2="40" y2="30" stroke={c.CIRCUIT} strokeWidth="1" opacity="0.5" />
            <line x1="40" y1="30" x2="50" y2="20" stroke={c.CIRCUIT} strokeWidth="1" opacity="0.5" />
            <line x1="35" y1="60" x2="40" y2="55" stroke={c.CIRCUIT} strokeWidth="1" opacity="0.5" />
            <line x1="40" y1="55" x2="45" y2="60" stroke={c.CIRCUIT} strokeWidth="1" opacity="0.5" />
            <circle cx="20" cy="20" r="3" fill={c.CIRCUIT} opacity="0.7" />
            <circle cx="60" cy="20" r="3" fill={c.CIRCUIT} opacity="0.7" />
            <circle cx="20" cy="60" r="3" fill={c.CIRCUIT} opacity="0.7" />
            <circle cx="60" cy="60" r="3" fill={c.CIRCUIT} opacity="0.7" />
            <circle cx="40" cy="40" r="4" fill={c.CIRCUIT} opacity="0.8" />
            <rect x="28" y="38" width="4" height="4" fill={c.CIRCUIT} opacity="0.5" rx="0.5" />
            <rect x="48" y="38" width="4" height="4" fill={c.CIRCUIT} opacity="0.5" rx="0.5" />
            <rect x="38" y="28" width="4" height="4" fill={c.CIRCUIT} opacity="0.5" rx="0.5" />
            <rect x="38" y="48" width="4" height="4" fill={c.CIRCUIT} opacity="0.5" rx="0.5" />
          </pattern>
          <filter id="chipGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuitPattern)" />
      </svg>

      {/* Central chip/orb - Star palette */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px]">
        <div
          className="absolute inset-0 rounded-full blur-[80px] motion-reduce:animate-none animate-pulse"
          style={{ backgroundColor: `${c.CIRCUIT}20`, animationDuration: '2s' }}
        />
        <div
          className="absolute inset-[50px] rounded-full blur-[50px] motion-reduce:animate-none animate-pulse"
          style={{ backgroundColor: `${c.CIRCUIT}25`, animationDuration: '2.5s', animationDelay: '0.5s' }}
        />
        <div
          className="absolute inset-[100px] rounded-full blur-[30px] motion-reduce:animate-none animate-pulse"
          style={{ backgroundColor: `${c.CIRCUIT_BRIGHT}30`, animationDuration: '1.5s', animationDelay: '0.2s' }}
        />
        <svg viewBox="0 0 200 200" className="w-full h-full opacity-70">
          <circle cx="100" cy="100" r="85" fill="none" stroke={c.CIRCUIT} strokeWidth="1" opacity="0.4" />
          <circle cx="100" cy="100" r="75" fill="none" stroke={c.CIRCUIT} strokeWidth="0.5" opacity="0.3" strokeDasharray="4 4" />
          <rect x="55" y="55" width="90" height="90" fill={c.CHIP_BG} stroke={c.CIRCUIT} strokeWidth="2" rx="6" opacity="0.9" />
          <rect x="70" y="70" width="60" height="60" fill={c.CHIP_DIE} stroke={c.CIRCUIT_BRIGHT} strokeWidth="1.5" rx="3" opacity="0.95" />
          <rect x="82" y="82" width="36" height="36" fill={c.CHIP_INNER} stroke={c.CIRCUIT} strokeWidth="0.5" rx="2" opacity="0.8" />
          <circle cx="100" cy="100" r="10" fill={c.CIRCUIT} opacity="0.9" filter="url(#chipGlow)" />
          <circle cx="100" cy="100" r="5" fill={c.CIRCUIT_BRIGHT} opacity="1" />
          <line x1="70" y1="55" x2="70" y2="30" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="85" y1="55" x2="85" y2="25" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="100" y1="55" x2="100" y2="20" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="115" y1="55" x2="115" y2="25" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="130" y1="55" x2="130" y2="30" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="70" y1="145" x2="70" y2="170" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="85" y1="145" x2="85" y2="175" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="100" y1="145" x2="100" y2="180" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="115" y1="145" x2="115" y2="175" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="130" y1="145" x2="130" y2="170" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="55" y1="70" x2="30" y2="70" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="55" y1="85" x2="25" y2="85" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="55" y1="100" x2="20" y2="100" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="55" y1="115" x2="25" y2="115" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="55" y1="130" x2="30" y2="130" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="145" y1="70" x2="170" y2="70" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="145" y1="85" x2="175" y2="85" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="145" y1="100" x2="180" y2="100" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="145" y1="115" x2="175" y2="115" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <line x1="145" y1="130" x2="170" y2="130" stroke={c.CIRCUIT} strokeWidth="2" opacity="0.8" />
          <circle cx="70" cy="30" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="85" cy="25" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="100" cy="20" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="115" cy="25" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="130" cy="30" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="70" cy="170" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="85" cy="175" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="100" cy="180" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="115" cy="175" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="130" cy="170" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="30" cy="70" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="25" cy="85" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="20" cy="100" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="25" cy="115" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="30" cy="130" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="170" cy="70" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="175" cy="85" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="180" cy="100" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="175" cy="115" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
          <circle cx="170" cy="130" r="3" fill={c.CIRCUIT_BRIGHT} opacity="0.9" />
        </svg>
      </div>

      {/* Animated data flow lines - travel full width/height, Star colors */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-0 w-full h-[3px] overflow-hidden">
          <div
            className="h-full w-[20%] min-w-[80px] motion-reduce:animate-none animate-[slideRight_3s_linear_infinite] opacity-80"
            style={{ background: `linear-gradient(to right, transparent, ${c.CIRCUIT_BRIGHT}, transparent)` }}
          />
        </div>
        <div className="absolute top-[30%] left-0 w-full h-[2px] overflow-hidden">
          <div
            className="h-full w-[20%] min-w-[80px] motion-reduce:animate-none animate-[slideRight_4s_linear_infinite] opacity-70"
            style={{ background: `linear-gradient(to right, transparent, ${c.CIRCUIT}, transparent)`, animationDelay: '0.5s' }}
          />
        </div>
        <div className="absolute top-[45%] left-0 w-full h-[3px] overflow-hidden">
          <div
            className="h-full w-[20%] min-w-[80px] motion-reduce:animate-none animate-[slideRight_2.5s_linear_infinite] opacity-75"
            style={{ background: `linear-gradient(to right, transparent, ${c.CIRCUIT_BRIGHT}, transparent)`, animationDelay: '1.2s' }}
          />
        </div>
        <div className="absolute top-[55%] left-0 w-full h-[2px] overflow-hidden">
          <div
            className="h-full w-[20%] min-w-[80px] motion-reduce:animate-none animate-[slideRight_3.5s_linear_infinite] opacity-70"
            style={{ background: `linear-gradient(to right, transparent, ${c.CIRCUIT}, transparent)`, animationDelay: '2s' }}
          />
        </div>
        <div className="absolute top-[70%] left-0 w-full h-[3px] overflow-hidden">
          <div
            className="h-full w-[20%] min-w-[80px] motion-reduce:animate-none animate-[slideRight_3s_linear_infinite] opacity-80"
            style={{ background: `linear-gradient(to right, transparent, ${c.CIRCUIT_BRIGHT}, transparent)`, animationDelay: '0.8s' }}
          />
        </div>
        <div className="absolute top-[85%] left-0 w-full h-[2px] overflow-hidden">
          <div
            className="h-full w-[20%] min-w-[80px] motion-reduce:animate-none animate-[slideRight_4.5s_linear_infinite] opacity-65"
            style={{ background: `linear-gradient(to right, transparent, ${c.CIRCUIT}, transparent)`, animationDelay: '1.5s' }}
          />
        </div>
        <div className="absolute left-[10%] top-0 w-[3px] h-full overflow-hidden">
          <div
            className="w-full h-[20%] min-h-[80px] motion-reduce:animate-none animate-[slideDown_4s_linear_infinite] opacity-75"
            style={{ background: `linear-gradient(to bottom, transparent, ${c.CIRCUIT_BRIGHT}, transparent)` }}
          />
        </div>
        <div className="absolute left-[25%] top-0 w-[2px] h-full overflow-hidden">
          <div
            className="w-full h-[20%] min-h-[80px] motion-reduce:animate-none animate-[slideDown_3s_linear_infinite] opacity-80"
            style={{ background: `linear-gradient(to bottom, transparent, ${c.CIRCUIT}, transparent)`, animationDelay: '1s' }}
          />
        </div>
        <div className="absolute left-[40%] top-0 w-[3px] h-full overflow-hidden">
          <div
            className="w-full h-[20%] min-h-[80px] motion-reduce:animate-none animate-[slideDown_3.5s_linear_infinite] opacity-70"
            style={{ background: `linear-gradient(to bottom, transparent, ${c.CIRCUIT_BRIGHT}, transparent)`, animationDelay: '0.3s' }}
          />
        </div>
        <div className="absolute left-[60%] top-0 w-[2px] h-full overflow-hidden">
          <div
            className="w-full h-[20%] min-h-[80px] motion-reduce:animate-none animate-[slideDown_4.5s_linear_infinite] opacity-75"
            style={{ background: `linear-gradient(to bottom, transparent, ${c.CIRCUIT}, transparent)`, animationDelay: '1.8s' }}
          />
        </div>
        <div className="absolute left-[75%] top-0 w-[3px] h-full overflow-hidden">
          <div
            className="w-full h-[20%] min-h-[80px] motion-reduce:animate-none animate-[slideDown_3s_linear_infinite] opacity-80"
            style={{ background: `linear-gradient(to bottom, transparent, ${c.CIRCUIT_BRIGHT}, transparent)`, animationDelay: '0.6s' }}
          />
        </div>
        <div className="absolute left-[90%] top-0 w-[2px] h-full overflow-hidden">
          <div
            className="w-full h-[20%] min-h-[80px] motion-reduce:animate-none animate-[slideDown_5s_linear_infinite] opacity-65"
            style={{ background: `linear-gradient(to bottom, transparent, ${c.CIRCUIT}, transparent)`, animationDelay: '2.2s' }}
          />
        </div>
      </div>

      {/* Pulsing node lights - Star palette */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-3 h-3 rounded-full motion-reduce:animate-none animate-ping opacity-60" style={{ backgroundColor: c.CIRCUIT, animationDuration: '2s' }} />
        <div className="absolute top-[30%] left-[80%] w-3 h-3 rounded-full motion-reduce:animate-none animate-ping opacity-55" style={{ backgroundColor: c.CIRCUIT_BRIGHT, animationDuration: '2.5s', animationDelay: '0.5s' }} />
        <div className="absolute top-[75%] left-[25%] w-3 h-3 rounded-full motion-reduce:animate-none animate-ping opacity-60" style={{ backgroundColor: c.CIRCUIT, animationDuration: '3s', animationDelay: '1s' }} />
        <div className="absolute top-[60%] left-[85%] w-3 h-3 rounded-full motion-reduce:animate-none animate-ping opacity-50" style={{ backgroundColor: c.CIRCUIT_BRIGHT, animationDuration: '2.2s', animationDelay: '1.5s' }} />
        <div className="absolute top-[10%] left-[50%] w-3 h-3 rounded-full motion-reduce:animate-none animate-ping opacity-55" style={{ backgroundColor: c.CIRCUIT, animationDuration: '2.8s', animationDelay: '0.3s' }} />
        <div className="absolute top-[90%] left-[40%] w-3 h-3 rounded-full motion-reduce:animate-none animate-ping opacity-60" style={{ backgroundColor: c.CIRCUIT_BRIGHT, animationDuration: '2.3s', animationDelay: '2s' }} />
        <div className="absolute top-[45%] left-[10%] w-2 h-2 rounded-full motion-reduce:animate-none animate-ping opacity-50" style={{ backgroundColor: c.STAR, animationDuration: '1.8s', animationDelay: '0.8s' }} />
        <div className="absolute top-[55%] left-[92%] w-2 h-2 rounded-full motion-reduce:animate-none animate-ping opacity-50" style={{ backgroundColor: c.STAR, animationDuration: '2.1s', animationDelay: '1.2s' }} />
      </div>

      {/* Starfield overlay - original twinkling stars */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <g fill={c.STAR}>
          {stars.map((star, i) => (
            <circle
              key={`star-${i}`}
              cx={star.x}
              cy={star.y}
              r={star.r}
              fill={c.STAR}
              opacity={0.5 + (i % 3) * 0.2}
            />
          ))}
        </g>
      </svg>

      {/* Vignette - use Star background color for fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, ${isDark ? 'rgba(26, 42, 58, 0.5)' : 'rgba(248, 252, 255, 0.4)'} 60%, ${isDark ? 'rgba(26, 42, 58, 0.9)' : 'rgba(248, 252, 255, 0.92)'} 100%)`,
        }}
      />

      {/* Subtle noise */}
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
