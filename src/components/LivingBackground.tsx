'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Light mode — soft pale blue / cyan (celestial light)
const LIGHT = {
  GREY_TRACE: 'rgba(135, 206, 235, 0.28)',
  GREY_GLOW: 'rgba(135, 206, 235, 0.45)',
  GREY_CHIP: 'rgba(176, 224, 230, 0.55)',
  GREY_CHIP_BORDER: 'rgba(26, 43, 66, 0.35)',
  CHIP_GLOW_FILL: 'rgba(26, 43, 66, 0.78)',
  CHIP_GLOW_NEIGHBOR_FILL: 'rgba(65, 105, 130, 0.5)',
  ZAP_HEAD: 'rgba(26, 43, 66, 0.2)',
  ZAP_TAIL: 'rgba(224, 242, 247, 0.2)',
} as const;

// Dark mode — deep blue / teal with cyan-green accent (Earth-from-space)
const DARK = {
  GREY_TRACE: 'rgba(72, 209, 204, 0.18)',
  GREY_GLOW: 'rgba(93, 230, 211, 0.32)',
  GREY_CHIP: 'rgba(30, 42, 59, 0.55)',
  GREY_CHIP_BORDER: 'rgba(72, 209, 204, 0.45)',
  CHIP_GLOW_FILL: 'rgba(93, 230, 211, 0.82)',
  CHIP_GLOW_NEIGHBOR_FILL: 'rgba(42, 74, 91, 0.62)',
  ZAP_HEAD: 'rgba(147, 255, 240, 0.2)',
  ZAP_TAIL: 'rgba(15, 26, 40, 0.2)',
} as const;

// Dense horizontal traces (y, path segments) - motherboard-style buses
const H_TRACES = [
  { y: 35, d: 'M 0 35 L 1000 35', dash: 6, speed: 3 },
  { y: 55, d: 'M 0 55 L 180 55 L 180 75 L 320 75 L 320 55 L 1000 55', dash: 8, speed: 2.8 },
  { y: 75, d: 'M 0 75 L 1000 75', dash: 5, speed: 3.2 },
  { y: 95, d: 'M 0 95 L 220 95 L 220 115 L 400 115 L 400 95 L 780 95 L 780 115 L 1000 115', dash: 7, speed: 2.5 },
  { y: 115, d: 'M 0 115 L 1000 115', dash: 6, speed: 3.5 },
  { y: 135, d: 'M 0 135 L 260 135 L 260 155 L 380 155 L 380 135 L 1000 135', dash: 8, speed: 2.9 },
  { y: 155, d: 'M 0 155 L 1000 155', dash: 5, speed: 3.1 },
  { y: 185, d: 'M 0 185 L 120 185 L 120 205 L 280 205 L 280 185 L 1000 185', dash: 7, speed: 2.7 },
  { y: 205, d: 'M 0 205 L 1000 205', dash: 6, speed: 3.4 },
  { y: 225, d: 'M 0 225 L 340 225 L 340 245 L 520 245 L 520 225 L 1000 225', dash: 8, speed: 2.6 },
  { y: 245, d: 'M 0 245 L 1000 245', dash: 5, speed: 3.3 },
  { y: 275, d: 'M 0 275 L 80 275 L 80 295 L 240 295 L 240 275 L 480 275 L 480 295 L 640 295 L 640 275 L 1000 275', dash: 7, speed: 2.8 },
  { y: 295, d: 'M 0 295 L 1000 295', dash: 6, speed: 3.0 },
  { y: 315, d: 'M 0 315 L 160 315 L 160 335 L 400 335 L 400 315 L 1000 315', dash: 8, speed: 2.4 },
  { y: 335, d: 'M 0 335 L 1000 335', dash: 5, speed: 3.6 },
  { y: 365, d: 'M 0 365 L 200 365 L 200 385 L 360 385 L 360 365 L 720 365 L 720 385 L 1000 385', dash: 7, speed: 2.9 },
  { y: 385, d: 'M 0 385 L 1000 385', dash: 6, speed: 3.2 },
  { y: 415, d: 'M 0 415 L 280 415 L 280 435 L 440 435 L 440 415 L 1000 415', dash: 8, speed: 2.5 },
  { y: 435, d: 'M 0 435 L 1000 435', dash: 5, speed: 3.4 },
  { y: 455, d: 'M 0 455 L 100 455 L 100 475 L 300 475 L 300 455 L 1000 455', dash: 7, speed: 2.7 },
  { y: 475, d: 'M 0 475 L 1000 475', dash: 6, speed: 3.1 },
  { y: 505, d: 'M 0 505 L 380 505 L 380 525 L 560 525 L 560 505 L 1000 505', dash: 8, speed: 2.8 },
  { y: 525, d: 'M 0 525 L 1000 525', dash: 5, speed: 3.5 },
  { y: 555, d: 'M 0 555 L 140 555 L 140 575 L 320 575 L 320 555 L 1000 555', dash: 7, speed: 2.6 },
  { y: 575, d: 'M 0 575 L 1000 575', dash: 6, speed: 3.0 },
  { y: 605, d: 'M 0 605 L 220 605 L 220 625 L 400 625 L 400 605 L 1000 605', dash: 8, speed: 2.9 },
  { y: 625, d: 'M 0 625 L 1000 625', dash: 5, speed: 3.3 },
  { y: 655, d: 'M 0 655 L 60 655 L 60 675 L 260 675 L 260 655 L 1000 655', dash: 7, speed: 2.4 },
  { y: 675, d: 'M 0 675 L 1000 675', dash: 6, speed: 3.2 },
  { y: 705, d: 'M 0 705 L 180 705 L 180 725 L 340 725 L 340 705 L 1000 705', dash: 8, speed: 2.7 },
  { y: 725, d: 'M 0 725 L 1000 725', dash: 5, speed: 3.4 },
  { y: 755, d: 'M 0 755 L 1000 755', dash: 6, speed: 2.8 },
];

// Dense vertical traces - like address/data lines
const V_TRACES = [
  { x: 40, d: 'M 40 0 L 40 800', dash: 6, speed: 3.2 },
  { x: 70, d: 'M 70 0 L 70 160 L 90 160 L 90 240 L 70 240 L 70 800', dash: 7, speed: 2.6 },
  { x: 90, d: 'M 90 0 L 90 800', dash: 5, speed: 3.5 },
  { x: 120, d: 'M 120 0 L 120 800', dash: 6, speed: 2.9 },
  { x: 150, d: 'M 150 0 L 150 320 L 170 320 L 170 480 L 150 480 L 150 800', dash: 8, speed: 2.4 },
  { x: 170, d: 'M 170 0 L 170 800', dash: 5, speed: 3.3 },
  { x: 200, d: 'M 200 0 L 200 800', dash: 7, speed: 2.8 },
  { x: 230, d: 'M 230 0 L 230 120 L 250 120 L 250 400 L 230 400 L 230 800', dash: 6, speed: 3.0 },
  { x: 250, d: 'M 250 0 L 250 800', dash: 5, speed: 3.4 },
  { x: 280, d: 'M 280 0 L 280 800', dash: 7, speed: 2.7 },
  { x: 310, d: 'M 310 0 L 310 200 L 330 200 L 330 600 L 310 600 L 310 800', dash: 8, speed: 2.5 },
  { x: 330, d: 'M 330 0 L 330 800', dash: 6, speed: 3.1 },
  { x: 360, d: 'M 360 0 L 360 800', dash: 5, speed: 3.6 },
  { x: 390, d: 'M 390 0 L 390 800', dash: 7, speed: 2.6 },
  { x: 420, d: 'M 420 0 L 420 280 L 440 280 L 440 520 L 420 520 L 420 800', dash: 8, speed: 2.9 },
  { x: 440, d: 'M 440 0 L 440 800', dash: 6, speed: 3.2 },
  { x: 470, d: 'M 470 0 L 470 800', dash: 5, speed: 2.8 },
  { x: 500, d: 'M 500 0 L 500 80 L 520 80 L 520 360 L 500 360 L 500 800', dash: 7, speed: 3.0 },
  { x: 520, d: 'M 520 0 L 520 800', dash: 6, speed: 3.4 },
  { x: 550, d: 'M 550 0 L 550 800', dash: 5, speed: 2.7 },
  { x: 580, d: 'M 580 0 L 580 160 L 600 160 L 600 640 L 580 640 L 580 800', dash: 8, speed: 2.5 },
  { x: 600, d: 'M 600 0 L 600 800', dash: 7, speed: 3.3 },
  { x: 630, d: 'M 630 0 L 630 800', dash: 6, speed: 2.9 },
  { x: 660, d: 'M 660 0 L 660 800', dash: 5, speed: 3.1 },
  { x: 690, d: 'M 690 0 L 690 400 L 710 400 L 710 560 L 690 560 L 690 800', dash: 8, speed: 2.6 },
  { x: 710, d: 'M 710 0 L 710 800', dash: 7, speed: 3.5 },
  { x: 740, d: 'M 740 0 L 740 800', dash: 6, speed: 2.8 },
  { x: 770, d: 'M 770 0 L 770 240 L 790 240 L 790 480 L 770 480 L 770 800', dash: 8, speed: 2.4 },
  { x: 790, d: 'M 790 0 L 790 800', dash: 5, speed: 3.2 },
  { x: 820, d: 'M 820 0 L 820 800', dash: 7, speed: 2.7 },
  { x: 850, d: 'M 850 0 L 850 800', dash: 6, speed: 3.0 },
  { x: 880, d: 'M 880 0 L 880 120 L 900 120 L 900 680 L 880 680 L 880 800', dash: 8, speed: 2.9 },
  { x: 900, d: 'M 900 0 L 900 800', dash: 5, speed: 3.4 },
  { x: 930, d: 'M 930 0 L 930 800', dash: 7, speed: 2.6 },
  { x: 960, d: 'M 960 0 L 960 800', dash: 6, speed: 3.1 },
];

const ZAP_TRAVEL_DURATION = 10;
const ZAP_REPEAT_DELAY = 3.2;

// Chips: [x, y, w, h] in viewBox 1000×800 — evenly distributed in a grid
const GRID_COLS = 12;
const GRID_ROWS = 8;
const GRID_PAD_X = 50;
const GRID_PAD_Y = 60;
const CHIP_W = 50;
const CHIP_H = 28;

const CHIPS = (() => {
  const viewW = 1000;
  const viewH = 800;
  const cellW = (viewW - 2 * GRID_PAD_X) / GRID_COLS;
  const cellH = (viewH - 2 * GRID_PAD_Y) / GRID_ROWS;
  const out: [number, number, number, number][] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = GRID_PAD_X + (col + 0.5) * cellW - CHIP_W / 2;
      const y = GRID_PAD_Y + (row + 0.5) * cellH - CHIP_H / 2;
      out.push([x, y, CHIP_W, CHIP_H]);
    }
  }
  return out;
})();

const CHIP_GLOW_DURATION = 3;
const CHIP_OPACITY_BASE = 0.5;
const CHIP_OPACITY_GLOW = 1;
const CHIP_OPACITY_NEIGHBOR = 0.5 + (CHIP_OPACITY_GLOW - CHIP_OPACITY_BASE) * 0.5;

function getNeighborIndices(index: number): number[] {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  const out: number[] = [];
  if (col > 0) out.push(index - 1);
  if (col < GRID_COLS - 1) out.push(index + 1);
  if (row > 0) out.push(index - GRID_COLS);
  if (row < GRID_ROWS - 1) out.push(index + GRID_COLS);
  return out;
}

function chipCenter(index: number): [number, number] {
  const [x, y, w, h] = CHIPS[index];
  return [x + w / 2, y + h / 2];
}

// Edges between neighboring chips: [chipA, chipB] with chipA < chipB (each edge once)
const CHIP_EDGES: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; i < CHIPS.length; i++) {
    for (const n of getNeighborIndices(i)) {
      if (n > i) out.push([i, n]);
    }
  }
  return out;
})();

// Zap line coords and per-edge delay for stagger: [x1, y1, x2, y2, delay]
function getChipZapCoords(edge: [number, number], edgeIndex: number): [number, number, number, number, number] {
  const [a, b] = edge;
  const [x1, y1] = chipCenter(a);
  const [x2, y2] = chipCenter(b);
  const delay = (edgeIndex % 12) * 0.25;
  return [x1, y1, x2, y2, delay];
}

/** Build SVG path for chip shape: central square + 3 lines out from each side. */
function chipShapePath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const s = Math.min(w, h) * 0.32; // half-size of inner square
  const lead = Math.min(w, h) * 0.28; // length of each pin line
  const pad = s / 2; // spacing between the 3 lines on each side (symmetrical)
  const t = cy - s,
    b = cy + s,
    l = cx - s,
    r = cx + s;
  const segments: string[] = [];
  // Central square
  segments.push(`M ${l} ${t} L ${r} ${t} L ${r} ${b} L ${l} ${b} Z`);
  // Top: 3 lines up from (cx-pad, t), (cx, t), (cx+pad, t)
  segments.push(`M ${cx - pad} ${t} L ${cx - pad} ${t - lead}`);
  segments.push(`M ${cx} ${t} L ${cx} ${t - lead}`);
  segments.push(`M ${cx + pad} ${t} L ${cx + pad} ${t - lead}`);
  // Right
  segments.push(`M ${r} ${cy - pad} L ${r + lead} ${cy - pad}`);
  segments.push(`M ${r} ${cy} L ${r + lead} ${cy}`);
  segments.push(`M ${r} ${cy + pad} L ${r + lead} ${cy + pad}`);
  // Bottom
  segments.push(`M ${cx - pad} ${b} L ${cx - pad} ${b + lead}`);
  segments.push(`M ${cx} ${b} L ${cx} ${b + lead}`);
  segments.push(`M ${cx + pad} ${b} L ${cx + pad} ${b + lead}`);
  // Left
  segments.push(`M ${l} ${cy - pad} L ${l - lead} ${cy - pad}`);
  segments.push(`M ${l} ${cy} L ${l - lead} ${cy}`);
  segments.push(`M ${l} ${cy + pad} L ${l - lead} ${cy + pad}`);
  return segments.join(' ');
}

interface LivingBackgroundProps {
  /** Circuit-board grid variant for login/auth pages */
  variant?: 'default' | 'grid';
}

export function LivingBackground({ variant = 'default' }: LivingBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const isGridVariant = variant === 'grid';
  // Grid variant always uses dark teal circuit-board aesthetic to match login design
  const isDark = isGridVariant || resolvedTheme === 'dark';
  const c = isDark ? DARK : LIGHT;

  const [glowStep, setGlowStep] = useState(0);
  const glowOrder = useMemo(() => shuffle(CHIPS.map((_, i) => i)), []);

  useEffect(() => {
    const id = setInterval(() => {
      setGlowStep((s) => s + 1);
    }, CHIP_GLOW_DURATION * 1000);
    return () => clearInterval(id);
  }, []);

  const n = CHIPS.length;
  const quarter = Math.max(1, Math.floor(n / 4));
  const primaryIndex = glowOrder[glowStep % n];
  const primaryIndex2 = glowOrder[(glowStep + quarter) % n];
  const primaryIndex3 = glowOrder[(glowStep + quarter * 2) % n];
  const primaryIndex4 = glowOrder[(glowStep + quarter * 3) % n];
  const neighborSet = useMemo(() => {
    const set = new Set<number>([
      ...getNeighborIndices(primaryIndex),
      ...getNeighborIndices(primaryIndex2),
      ...getNeighborIndices(primaryIndex3),
      ...getNeighborIndices(primaryIndex4),
    ]);
    set.delete(primaryIndex);
    set.delete(primaryIndex2);
    set.delete(primaryIndex3);
    set.delete(primaryIndex4);
    return set;
  }, [primaryIndex, primaryIndex2, primaryIndex3, primaryIndex4]);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 opacity-60">
      {/* Base gradient - light (soft pale blue / cyan) - hidden for grid variant */}
      <div
        className="absolute inset-0 dark:opacity-0"
        style={{
          background:
            'linear-gradient(160deg, #F0FFFF 0%, #E0F2F7 45%, #E8F4F8 100%)',
          opacity: isGridVariant ? 0 : undefined,
        }}
      />
      {/* Base gradient - dark (lighter purple for grid; deep blue/teal for non-grid) */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          background: isGridVariant
            ? 'linear-gradient(160deg, #1e1c2e 0%, #2a2748 35%, #3d3865 65%, #25223a 100%)'
            : 'linear-gradient(160deg, #0F1A28 0%, #1E2A3B 35%, #2A4B7D 65%, #1E2A3B 100%)',
          opacity: isGridVariant ? 1 : undefined,
        }}
      />

      {/* Very light Earth/hero image overlay - hidden for grid variant */}
      {!isGridVariant && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.5]"
          style={{ backgroundImage: 'url(/hero-earth-overlay.png)' }}
        />
      )}

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 800"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 1 }}
      >
        <defs>
          <linearGradient id="traceH" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={c.GREY_TRACE} stopOpacity="0.5" />
            <stop offset="50%" stopColor={c.GREY_GLOW} stopOpacity="0.8" />
            <stop offset="100%" stopColor={c.GREY_TRACE} stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="traceV" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={c.GREY_TRACE} stopOpacity="0.5" />
            <stop offset="50%" stopColor={c.GREY_GLOW} stopOpacity="0.8" />
            <stop offset="100%" stopColor={c.GREY_TRACE} stopOpacity="0.5" />
          </linearGradient>
          <filter id="traceGlow">
            <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="zapGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Zap gradient: dark tail (0%) → bright head (100%) along the path */}
          <linearGradient id="zapGradientH" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={c.ZAP_TAIL} />
            <stop offset="60%" stopColor={c.ZAP_TAIL} />
            <stop offset="100%" stopColor={c.ZAP_HEAD} />
          </linearGradient>
          <linearGradient id="zapGradientV" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={c.ZAP_TAIL} />
            <stop offset="60%" stopColor={c.ZAP_TAIL} />
            <stop offset="100%" stopColor={c.ZAP_HEAD} />
          </linearGradient>
          {/* Per-edge gradients so zap head/tail follow the line direction (chip-to-chip) */}
          {CHIP_EDGES.map((edge, i) => {
            const [x1, y1, x2, y2] = getChipZapCoords(edge, i);
            return (
              <linearGradient
                key={i}
                id={`zapGrad-${i}`}
                gradientUnits="userSpaceOnUse"
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
              >
                <stop offset="0%" stopColor={c.ZAP_TAIL} />
                <stop offset="60%" stopColor={c.ZAP_TAIL} />
                <stop offset="100%" stopColor={c.ZAP_HEAD} />
              </linearGradient>
            );
          })}
        </defs>

        {/* Dense horizontal traces - circuit-board grid lines (grid variant) */}
        {isGridVariant && (
          <g fill="none" stroke="url(#traceH)" strokeWidth="0.9" filter="url(#traceGlow)">
            {H_TRACES.map((t, i) => (
              <motion.path
                key={`h-${i}`}
                d={t.d}
                strokeDasharray={`${t.dash} ${14 - t.dash}`}
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: -(t.dash + (14 - t.dash)) }}
                transition={{ duration: t.speed, repeat: Infinity, ease: 'linear' }}
              />
            ))}
          </g>
        )}

        {/* Dense vertical traces - circuit-board grid lines (grid variant) */}
        {isGridVariant && (
          <g fill="none" stroke="url(#traceV)" strokeWidth="0.9" filter="url(#traceGlow)">
            {V_TRACES.map((t, i) => (
              <motion.path
                key={`v-${i}`}
                d={t.d}
                strokeDasharray={`${t.dash} ${14 - t.dash}`}
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: i % 2 === 0 ? -(t.dash + (14 - t.dash)) : t.dash + (14 - t.dash) }}
                transition={{ duration: t.speed, repeat: Infinity, ease: 'linear' }}
              />
            ))}
          </g>
        )}

        {/* Chips - square with 3 symmetrical lines per side; dark blue glow in random order with neighbor bleed */}
        <g stroke={c.GREY_CHIP_BORDER} strokeWidth="1.2">
          {CHIPS.map(([x, y, w, h], i) => {
            const isPrimary = i === primaryIndex || i === primaryIndex2 || i === primaryIndex3 || i === primaryIndex4;
            const isNeighbor = neighborSet.has(i);
            const fill = isPrimary
              ? c.CHIP_GLOW_FILL
              : isNeighbor
                ? c.CHIP_GLOW_NEIGHBOR_FILL
                : c.GREY_CHIP;
            const opacity = isPrimary
              ? CHIP_OPACITY_GLOW
              : isNeighbor
                ? CHIP_OPACITY_NEIGHBOR
                : CHIP_OPACITY_BASE;
            return (
              <motion.path
                key={`chip-${i}`}
                d={chipShapePath(x, y, w, h)}
                fillRule="evenodd"
                initial={{ fill: c.GREY_CHIP, opacity: CHIP_OPACITY_BASE }}
                animate={{ fill, opacity }}
                transition={{
                  duration: 0.4,
                  ease: 'easeInOut',
                }}
              />
            );
          })}
        </g>

        {/* Electricity zaps - chip-to-chip lines, traveling bright head with dark tail */}
        <g fill="none" strokeWidth="1.5" strokeLinecap="round" filter="url(#zapGlow)">
          {CHIP_EDGES.map((edge, i) => {
            const [x1, y1, x2, y2, delay] = getChipZapCoords(edge, i);
            return (
              <motion.path
                key={`zap-${i}`}
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                pathLength={1}
                stroke={`url(#zapGrad-${i})`}
                strokeDasharray="0.12 1"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: 20 }}
                transition={{
                  duration: ZAP_TRAVEL_DURATION,
                  repeat: Infinity,
                  repeatDelay: ZAP_REPEAT_DELAY + (i % 4) * 0.5,
                  delay: delay + (i % 3) * 0.2,
                  ease: 'linear',
                }}
              />
            );
          })}
        </g>
      </svg>

      {/* Subtle noise - lighter in light mode, very subtle in dark */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      </div>
    </div>
  );
}
