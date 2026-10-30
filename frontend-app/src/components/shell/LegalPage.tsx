import ThemeShell from './ThemeShell';
import type { LegalDoc } from '@/content/legal/types';
import { getT } from '@/i18n/server';

const LEGAL_LINKS = [
  { href: '/terms', label: 'Điều khoản' },
  { href: '/privacy', label: 'Bảo mật' },
  { href: '/media-policy', label: 'Hình ảnh' },
];

/** Legal documents (terms, privacy, media policy) in the new theme, in the visitor's language. Body styling lives in `.of-legal`. */
export default function LegalPage({
  docs,
  updated,
  current,
}: {
  docs: Record<string, LegalDoc>;
  updated: string;
  current: string;
}) {
  const { locale, t } = getT();
  const doc = docs[locale];
  return (
    <ThemeShell>
      <div className="mx-auto max-w-[920px] px-4 pb-20 pt-10 lg:px-6 lg:pb-28 lg:pt-16">
        <div className="of-eyebrow of-eyebrow--left">{t('Văn bản pháp lý')}</div>
        <h1 className="of-display mt-2 text-[44px] leading-[0.95] lg:text-[72px]">{doc.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <span className="of-hud text-[11px] text-[color:var(--mute)]">
            {t('Cập nhật lần cuối:')} {updated}
          </span>
          <nav aria-label={t('Văn bản liên quan')} className="flex gap-2">
            {LEGAL_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                aria-current={l.href === current ? 'page' : undefined}
                className={`of-chip ${l.href === current ? '' : '!border-white/25 !bg-transparent !text-[#CBD6CF] hover:!text-white'}`}
              >
                {t(l.label)}
              </a>
            ))}
          </nav>
        </div>
        {locale !== 'vi' && (
          <p className="mt-5 border-l-2 border-[color:var(--gold-2)] pl-3 text-[14px] text-[#CBD6CF]">
            {t('Bản dịch chỉ để tham khảo. Bản tiếng Việt là bản có giá trị pháp lý.')}
          </p>
        )}
        <div className="of-rule mt-8" />
        <article className="of-legal mt-8">
          <div>
            {doc.intro?.map((p) => <p key={p}>{p}</p>)}
            <div>
              {doc.sections.map((s) => (
                <section key={s.title}>
                  <h2>{s.title}</h2>
                  {s.lead?.map((p) => <p key={p}>{p}</p>)}
                  {s.items && (
                    <ul>
                      {s.items.map(([label, text]) => (
                        <li key={label}>
                          <strong>{label}</strong> {text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.notes?.map((p) => <p key={p}>{p}</p>)}
                </section>
              ))}
            </div>
          </div>
          <div className="of-legal-contact">
            <h3>{t('Liên hệ với chúng tôi')}</h3>
            <p>{doc.contact}</p>
            <ul>
              <li>
                Email: <a href="mailto:11nguoirasan@11onfield.com">11nguoirasan@11onfield.com</a>
              </li>
              <li>
                Hotline: <a href="tel:+84902383511">090 2383 511</a>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </ThemeShell>
  );
}
