import type { Locale } from '@/i18n/config';

/** Inline SVG flags: emoji flags don't render on Windows. 3:2 viewBox, scale with width/height. */
export default function Flag({ locale, className = '' }: { locale: Locale; className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      {locale === 'vi' && (
        <>
          <rect width="30" height="20" fill="#DA251D" />
          <path fill="#FFFF00" d="M15 4.2l1.36 4.18h4.4l-3.56 2.59 1.36 4.18L15 12.56l-3.56 2.59 1.36-4.18-3.56-2.59h4.4z" />
        </>
      )}
      {locale === 'en' && (
        <>
          <rect width="30" height="20" fill="#012169" />
          <path d="M0 0l30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
          <path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.6" />
          <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" />
          <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="3.4" />
        </>
      )}
      {locale === 'es' && (
        <>
          <rect width="30" height="20" fill="#AA151B" />
          <rect y="5" width="30" height="10" fill="#F1BF00" />
          <rect x="7" y="8" width="3" height="4" rx="0.6" fill="#AA151B" />
        </>
      )}
      {locale === 'ko' && (
        <>
          <rect width="30" height="20" fill="#fff" />
          <g transform="rotate(33.7 15 10)">
            <circle cx="15" cy="10" r="5" fill="#CD2E3A" />
            <path d="M10 10a5 5 0 0 0 10 0a2.5 2.5 0 0 0-5 0a2.5 2.5 0 0 1-5 0z" fill="#0047A0" />
          </g>
          <g stroke="#000" strokeWidth="0.9">
            <path d="M4.6 4.1l2.4-1.6M5.2 5l2.4-1.6M5.8 5.9l2.4-1.6" />
            <path d="M22 15.7l2.4-1.6M22.6 16.6l2.4-1.6M23.2 17.5l2.4-1.6" />
            <path d="M4.6 15.9l2.4 1.6M5.2 15l2.4 1.6M5.8 14.1l2.4 1.6" />
            <path d="M22 4.3l2.4 1.6M22.6 3.4l2.4 1.6M23.2 2.5l2.4 1.6" />
          </g>
        </>
      )}
    </svg>
  );
}
