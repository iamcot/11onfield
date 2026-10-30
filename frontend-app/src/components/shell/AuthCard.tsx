import type { ReactNode } from 'react';
import ThemeShell from './ThemeShell';

/** Two-column auth layout in the night-stadium theme: headline on the left (desktop), form card on the right. */
export default function AuthCard({
  eyebrow,
  title,
  subtitle,
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  aside: { eyebrow: string; title: ReactNode; text: string };
  children: ReactNode;
}) {
  return (
    <ThemeShell footer={false}>
      <div className="mx-auto grid min-h-[calc(100svh-var(--header-h))] max-w-[1240px] items-center gap-10 px-4 py-10 lg:grid-cols-[1fr_460px] lg:gap-16 lg:px-6">
        <div className="hidden lg:block" data-reveal="">
          <div className="of-eyebrow of-eyebrow--left">{aside.eyebrow}</div>
          <h1 className="of-display mt-3 text-[88px] leading-[0.9]">{aside.title}</h1>
          <p className="of-lede mt-5 max-w-md !text-[#CBD6CF]">{aside.text}</p>
        </div>

        <div className="of-glass of-cut of-cut--lg of-cut--b2 of-run of-step-in relative p-6 lg:p-9">
          <div className="of-brackets" />
          <div className="of-hud text-[11px] text-[color:var(--lime)]">{eyebrow}</div>
          <h2 className="of-display mt-1 text-[40px] lg:text-[48px]">{title}</h2>
          {subtitle && <p className="mt-1 text-[14.5px] text-[#CBD6CF]">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </ThemeShell>
  );
}

export function Notice({ tone, children }: { tone: 'ok' | 'error'; children: ReactNode }) {
  return tone === 'ok' ? (
    <div className="border border-[rgba(166,227,90,0.45)] bg-[rgba(166,227,90,0.1)] px-4 py-3 text-[14px] text-[#E2F5CF]">{children}</div>
  ) : (
    <div className="border border-[rgba(255,138,128,0.5)] bg-[rgba(255,138,128,0.08)] px-4 py-3 text-[14px] text-[#FFD2CD]" role="alert">
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="of-hud text-[10px] text-[color:var(--mute)]">{children}</span>;
}

/** Turns fetch() network failures into a readable message. */
export function errorMessage(err: unknown, fallback: string) {
  const raw = (err as { message?: string })?.message;
  if (err instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(raw ?? '')) {
    return 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại sau ít phút.';
  }
  return raw || fallback;
}
