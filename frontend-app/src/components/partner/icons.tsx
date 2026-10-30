const p = {
  width: 40,
  height: 40,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  'aria-hidden': true,
} as const;

export const PIcons = {
  film: (
    <svg {...p}>
      <rect x="2" y="6" width="14" height="12" rx="1.5" />
      <path d="M16 10l6-3v10l-6-3z" />
    </svg>
  ),
  pulse: (
    <svg {...p}>
      <path d="M2 12h4l2-5 4 10 2-5h8" />
    </svg>
  ),
  app: (
    <svg {...p}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M9 13l2 2 4-4" />
    </svg>
  ),
  shield: (
    <svg {...p}>
      <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </svg>
  ),
  ball: (
    <svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7l4 3-1.5 4.5h-5L8 10z" />
      <path d="M12 3v4M16 10l4.5-1.5M14.5 14.5l2.5 4M9.5 14.5L7 18.5M8 10L3.5 8.5" />
    </svg>
  ),
  academy: (
    <svg {...p}>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11v5c3 2 9 2 12 0v-5" />
    </svg>
  ),
  pitch: (
    <svg {...p}>
      <rect x="2" y="5" width="20" height="14" rx="1" />
      <path d="M12 5v14" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M2 9h3v6H2M22 9h-3v6h3" />
    </svg>
  ),
  tv: (
    <svg {...p}>
      <rect x="2" y="5" width="20" height="13" rx="1.5" />
      <path d="M8 21h8M12 18v3" />
    </svg>
  ),
  social: (
    <svg {...p}>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.2 10.9l7.6-3.8M8.2 13.1l7.6 3.8" />
    </svg>
  ),
  heart: (
    <svg {...p}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
};
