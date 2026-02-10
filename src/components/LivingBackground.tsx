'use client';

import { motion } from 'framer-motion';

const PURPLE_TRACE = 'rgba(196, 181, 253, 0.5)';
const PURPLE_GLOW = 'rgba(167, 139, 250, 0.6)';
const PURPLE_CHIP = 'rgba(221, 214, 254, 0.85)';
const PURPLE_CHIP_BORDER = 'rgba(196, 181, 253, 0.7)';

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

// Chips: [x, y, w, h] in viewBox coordinates - evenly distributed across 1000×800
const CHIPS = [
  // Top row (y ~50–80)
  [60, 50, 50, 28],
  [220, 65, 55, 32],
  [400, 50, 48, 26],
  [580, 65, 52, 30],
  [760, 50, 46, 28],
  [920, 65, 50, 26],
  // Upper-mid (y ~160–220)
  [80, 170, 55, 32],
  [260, 185, 48, 28],
  [440, 170, 60, 35],
  [620, 185, 50, 30],
  [800, 170, 52, 28],
  [80, 250, 45, 26],
  [260, 235, 58, 34],
  [440, 250, 48, 28],
  [620, 235, 55, 32],
  [800, 250, 46, 26],
  // Middle (y ~320–400)
  [60, 330, 52, 30],
  [220, 350, 48, 26],
  [400, 330, 62, 38],
  [580, 350, 50, 28],
  [760, 330, 54, 32],
  [920, 350, 48, 26],
  [60, 420, 48, 28],
  [220, 400, 55, 32],
  [400, 420, 50, 26],
  [580, 400, 58, 34],
  [760, 420, 46, 28],
  [920, 400, 52, 30],
  // Lower-mid (y ~500–560)
  [80, 510, 55, 32],
  [260, 530, 50, 28],
  [440, 510, 48, 26],
  [620, 530, 56, 34],
  [800, 510, 50, 30],
  [80, 590, 46, 28],
  [260, 570, 52, 30],
  [440, 590, 54, 32],
  [620, 570, 48, 26],
  [800, 590, 50, 28],
  // Bottom row (y ~650–700)
  [60, 660, 50, 28],
  [220, 680, 52, 30],
  [400, 660, 48, 26],
  [580, 680, 55, 32],
  [760, 660, 46, 28],
  [920, 680, 50, 26],
];

export function LivingBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden
    >
      {/* Base gradient - subtle board color */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg, rgba(245, 243, 255, 0.95) 0%, rgba(237, 233, 254, 0.92) 50%, rgba(243, 232, 255, 0.94) 100%)',
        }}
      />

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 800"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.9 }}
      >
        <defs>
          <linearGradient id="traceH" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={PURPLE_TRACE} stopOpacity="0.4" />
            <stop offset="50%" stopColor={PURPLE_GLOW} stopOpacity="0.9" />
            <stop offset="100%" stopColor={PURPLE_TRACE} stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="traceV" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={PURPLE_TRACE} stopOpacity="0.4" />
            <stop offset="50%" stopColor={PURPLE_GLOW} stopOpacity="0.9" />
            <stop offset="100%" stopColor={PURPLE_TRACE} stopOpacity="0.4" />
          </linearGradient>
          <filter id="traceGlow">
            <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dense horizontal traces */}
        <g fill="none" stroke="url(#traceH)" strokeWidth="1.2" filter="url(#traceGlow)">
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

        {/* Dense vertical traces */}
        <g fill="none" stroke="url(#traceV)" strokeWidth="1.2" filter="url(#traceGlow)">
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

        {/* Chips - drawn on top like components on a board */}
        <g>
          {CHIPS.map(([x, y, w, h], i) => (
            <motion.rect
              key={`chip-${i}`}
              x={x}
              y={y}
              width={w}
              height={h}
              rx={2}
              fill={PURPLE_CHIP}
              stroke={PURPLE_CHIP_BORDER}
              strokeWidth="1.5"
              initial={{ opacity: 0.85 }}
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{
                duration: 2.2 + (i % 5) * 0.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: (i % 8) * 0.15,
              }}
            />
          ))}
        </g>
      </svg>

      {/* Subtle noise */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
}
