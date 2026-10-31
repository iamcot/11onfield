'use client';

import Link from 'next/link';
import { ArrowRight } from './ui';
import { useT } from '@/i18n/I18nProvider';

/** Text link to the open competition's page, shown under a sign-up button. */
export default function CompetitionLink({ href, className = '' }: { href: string | null; className?: string }) {
  const t = useT();
  if (!href) return null;
  return (
    <Link href={href} className={`of-comp-link ${className}`}>
      {t('Xem chương trình đang diễn ra')} <ArrowRight size={16} />
    </Link>
  );
}
