import type { ReactNode } from 'react';
import ThemeShell from './ThemeShell';

const LEGAL_LINKS = [
  { href: '/terms', label: 'Điều khoản' },
  { href: '/privacy', label: 'Bảo mật' },
  { href: '/media-policy', label: 'Hình ảnh' },
];

/** Legal documents (terms, privacy, media policy) in the new theme. Body styling lives in `.of-legal`. */
export default function LegalPage({
  title,
  updated,
  current,
  children,
}: {
  title: string;
  updated: string;
  current: string;
  children: ReactNode;
}) {
  return (
    <ThemeShell>
      <div className="mx-auto max-w-[920px] px-4 pb-20 pt-10 lg:px-6 lg:pb-28 lg:pt-16">
        <div className="of-eyebrow of-eyebrow--left">Văn bản pháp lý</div>
        <h1 className="of-display mt-2 text-[44px] leading-[0.95] lg:text-[72px]">{title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <span className="of-hud text-[11px] text-[color:var(--mute)]">Cập nhật lần cuối: {updated}</span>
          <nav aria-label="Văn bản liên quan" className="flex gap-2">
            {LEGAL_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                aria-current={l.href === current ? 'page' : undefined}
                className={`of-chip ${l.href === current ? '' : '!border-white/25 !bg-transparent !text-[#CBD6CF] hover:!text-white'}`}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="of-rule mt-8" />
        <article className="of-legal mt-8">{children}</article>
      </div>
    </ThemeShell>
  );
}
