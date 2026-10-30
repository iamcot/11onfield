import type { CSSProperties, ReactNode } from 'react';

export function revealDelay(d: number): CSSProperties {
  return { ['--d' as string]: d } as CSSProperties;
}

export function cssVars(vars: Record<string, string | number>): CSSProperties {
  return vars as CSSProperties;
}

export function SectionHead({
  eyebrow,
  title,
  lede,
  align = 'center',
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: 'center' | 'left';
}) {
  const center = align === 'center';
  return (
    <div className={center ? 'text-center' : ''} data-reveal="">
      <div className={`of-eyebrow ${center ? '' : 'of-eyebrow--left'}`}>{eyebrow}</div>
      <h2 className="of-h2 mt-3">{title}</h2>
      {lede && <p className={`of-lede mt-3 ${center ? 'mx-auto' : ''} max-w-2xl`}>{lede}</p>}
    </div>
  );
}

export function ArrowRight({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const iconProps = {
  width: 40,
  height: 40,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  'aria-hidden': true,
} as const;

export const Icons = {
  coach: (
    <svg {...iconProps}>
      <path d="M6 3h12l-2 7H8z" />
      <path d="M9 10l-2 11M15 10l2 11M7 16h10" />
    </svg>
  ),
  globe: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </svg>
  ),
  stadium: (
    <svg {...iconProps}>
      <ellipse cx="12" cy="13" rx="10" ry="5" />
      <ellipse cx="12" cy="13" rx="5" ry="2.2" />
      <path d="M5 9V5M19 9V5M12 8V3" />
    </svg>
  ),
  contract: (
    <svg {...iconProps}>
      <path d="M4 4h12l4 4v12H4z" />
      <path d="M8 13h8M8 17h5M15 4v4h5" />
    </svg>
  ),
  scholarship: (
    <svg {...iconProps}>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11v5c3 2 9 2 12 0v-5" />
    </svg>
  ),
  trophy: (
    <svg {...iconProps}>
      <path d="M7 4h10v4a5 5 0 01-10 0z" />
      <path d="M7 6H4a3 3 0 003 4M17 6h3a3 3 0 01-3 4M12 13v4M8 21h8M9 17h6" />
    </svg>
  ),
  panel: (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 15c3 0 6 2 6 5" />
    </svg>
  ),
  pulse: (
    <svg {...iconProps}>
      <path d="M2 12h4l2-5 4 10 2-5h8" />
    </svg>
  ),
  vote: (
    <svg {...iconProps}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M9 13l2 2 4-4" />
    </svg>
  ),
};
