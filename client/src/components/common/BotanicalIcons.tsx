import React from 'react';

/*
  Modern duotone line icons
  - 32x32 grid, 1.6 rounded stroke
  - Main shapes carry a soft tint (currentColor @ 14%) so every icon
    follows the surrounding text colour automatically
  - Small sparkle / drop accents give each icon a fresh, premium feel
*/

type IconProps = { className?: string };

const TINT = { fill: 'currentColor', fillOpacity: 0.14 } as const;

const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({ className = 'w-7 h-7', children }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

/* ------------------------------------------------------------------ */
/* Value proposition icons                                             */
/* ------------------------------------------------------------------ */

export const NaturalIngredientsIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M7 25C7 14 14 7 26 6C26 18 19.5 25 10 25C8.9 25 7.9 25 7 25Z" {...TINT} />
    <path d="M6 27L19 13" />
    <path d="M14.5 17.5H19.5M17 20.5H21" />
    <path d="M25.5 21V25M23.5 23H27.5" />
  </Svg>
);

export const LabTestedIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M13 5H19" />
    <path d="M10.4 19.5H21.6L23.5 22.6C24.7 24.6 23.3 27 21 27H11C8.7 27 7.3 24.6 8.5 22.6L10.4 19.5Z" {...TINT} stroke="none" />
    <path d="M14 5V12L8.5 22.6C7.3 24.6 8.7 27 11 27H21C23.3 27 24.7 24.6 23.5 22.6L18 12V5" />
    <path d="M10.4 19.5H21.6" />
    <circle cx="14" cy="23.2" r="1" fill="currentColor" stroke="none" />
    <circle cx="18.2" cy="22" r="0.9" fill="currentColor" stroke="none" />
    <path d="M25 4V8M23 6H27" />
  </Svg>
);

export const SafeFormulaIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M16 4L26 8V15C26 21.5 21.8 26.2 16 28C10.2 26.2 6 21.5 6 15V8L16 4Z" {...TINT} />
    <path d="M11.5 16L14.8 19.2L20.5 12.8" />
  </Svg>
);

export const FreeShippingIcon: React.FC<IconProps> = ({ className }) => (
  <Svg className={className}>
    <path d="M16 4L27 9.5V22.5L16 28L5 22.5V9.5L16 4Z" {...TINT} />
    <path d="M5 9.5L16 15L27 9.5" />
    <path d="M16 15V28" />
    <path d="M10.5 6.8L21.5 12.3" />
  </Svg>
);

/* ------------------------------------------------------------------ */
/* Category icons                                                      */
/* ------------------------------------------------------------------ */

/*
  Layered duotone set
  - Soft body tint (TINT) + a stronger accent layer (ACCENT) for depth
  - A small solid water drop is the shared Hydra signature
*/
const ACCENT = { fill: 'currentColor', fillOpacity: 0.35, stroke: 'none' } as const;
const SOLID = { fill: 'currentColor', stroke: 'none' } as const;

// Water drop whose tip sits at (x, y); s scales it
const Drop: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <path
    d={`M${x} ${y}C${x} ${y} ${x - 2.2 * s} ${y + 2.6 * s} ${x - 2.2 * s} ${y + 4.1 * s}C${x - 2.2 * s} ${
      y + 5.3 * s
    } ${x - 1.2 * s} ${y + 6.2 * s} ${x} ${y + 6.2 * s}C${x + 1.2 * s} ${y + 6.2 * s} ${x + 2.2 * s} ${
      y + 5.3 * s
    } ${x + 2.2 * s} ${y + 4.1 * s}C${x + 2.2 * s} ${y + 2.6 * s} ${x} ${y} ${x} ${y}Z`}
    {...SOLID}
  />
);

export const CategoryIcon: React.FC<{ name: string; className?: string }> = ({
  name,
  className = 'w-8 h-8 text-[#13382B]',
}) => {
  switch (name.trim().toLowerCase()) {
    case 'face care':
      return (
        <Svg className={className}>
          <path d="M16 4.5C10.8 4.5 7.5 8.8 7.5 14.5C7.5 21 11.4 27 16 27C20.6 27 24.5 21 24.5 14.5C24.5 8.8 21.2 4.5 16 4.5Z" {...TINT} />
          {/* hair swoop */}
          <path d="M7.8 12.5C10.8 12.5 14.5 10.5 16.5 7C18 9.8 21 12 24.2 12.5" />
          {/* closed eyes + smile */}
          <path d="M11.5 16.2C12.3 17 13.7 17 14.5 16.2M17.5 16.2C18.3 17 19.7 17 20.5 16.2" />
          <path d="M14 21.2C15.2 22 16.8 22 18 21.2" />
          <Drop x={27} y={2.5} s={0.85} />
        </Svg>
      );

    case 'body care':
      return (
        <Svg className={className}>
          {/* pump bottle */}
          <rect x="10" y="13" width="12" height="15" rx="3.5" {...TINT} />
          <path d="M13 13V10.5H19V13" />
          <path d="M16 10.5V6.5M12.5 6.5H19.5L22 8.2" />
          <rect x="12.5" y="17.5" width="7" height="6.5" rx="1.6" {...ACCENT} />
          <path d="M14 20.75H18" />
          <Drop x={6} y={4.5} s={0.8} />
        </Svg>
      );

    case 'hair care':
      return (
        <Svg className={className}>
          {/* flowing strands */}
          <path d="M5 10C8 7 11 13 14 10S20 7 23 10" />
          <path d="M9 15C12 12 15 18 18 15S24 12 27 15" />
          {/* wide-tooth comb */}
          <rect x="5" y="19" width="22" height="4" rx="2" {...TINT} />
          <path d="M8.5 23V27M12 23V27M15.5 23V27M19 23V27M22.5 23V27" />
          <Drop x={27} y={3} s={0.8} />
        </Svg>
      );

    case 'skincare sets':
      return (
        <Svg className={className}>
          <path d="M3.5 27.5H28.5" />
          {/* dropper bottle */}
          <rect x="5" y="15" width="7" height="12.5" rx="2" {...TINT} />
          <path d="M7 15V12.5H10V15" />
          <path d="M7.5 12.5V8.5C7.5 7.4 8 6.5 8.5 6.5C9 6.5 9.5 7.4 9.5 8.5V12.5" {...ACCENT} />
          {/* tall tube */}
          <path d="M14 27.5V11.5L15.5 8.5H18.5L20 11.5V27.5Z" {...TINT} />
          <path d="M15.5 8.5V6H18.5V8.5M16 16H18" />
          {/* jar */}
          <rect x="21.5" y="20" width="7" height="7.5" rx="2" {...TINT} />
          <rect x="21" y="17.5" width="8" height="2.5" rx="1.2" {...ACCENT} />
        </Svg>
      );

    case 'natural care':
      return (
        <Svg className={className}>
          {/* seedling rising from soil */}
          <path d="M5 27.5C8 23.5 24 23.5 27 27.5Z" {...TINT} />
          <path d="M16 24.5V13" />
          <path d="M16 17C16 12.5 12.8 9.5 8 9.5C8 14 11.2 17 16 17Z" {...TINT} />
          <path d="M16 13C16 8.5 19.2 5 24 5C24 9.5 20.8 13 16 13Z" fill="currentColor" fillOpacity={0.35} />
          <Drop x={25.5} y={13} s={0.75} />
        </Svg>
      );

    case 'night care':
      return (
        <Svg className={className}>
          <path d="M20 5.5A11 11 0 1 0 26.5 21A9 9 0 0 1 20 5.5Z" {...TINT} />
          {/* four-point star + dot */}
          <path d="M24 6.5L24.8 8.7L27 9.5L24.8 10.3L24 12.5L23.2 10.3L21 9.5L23.2 8.7Z" {...SOLID} />
          <circle cx="27.5" cy="15" r="0.9" {...SOLID} />
        </Svg>
      );

    case 'organic range':
    default:
      return (
        <Svg className={className}>
          {/* certified seal */}
          <circle cx="16" cy="16" r="12" {...TINT} />
          <circle cx="16" cy="16" r="9" strokeWidth="1.2" strokeDasharray="1.5 2.5" />
          <path d="M11.5 20.5C11.5 15 15 11.5 20.5 11.5C20.5 17 17 20.5 11.5 20.5Z" fill="currentColor" fillOpacity={0.35} />
          <path d="M11.5 20.5L17 15" />
        </Svg>
      );
  }
};