'use client';

import { setFxEnabled, useFx } from '@/lib/fx';
import { useT } from '@/i18n/I18nProvider';

/** Switch for the fireflies of the backdrop and the stage sparkles (saved in this browser). */
export default function FxToggle() {
  const t = useT();
  const on = useFx();
  return (
    <button type="button" className="pp-toggle" aria-pressed={on} onClick={() => setFxEnabled(!on)}>
      <i />
      {t('Đom đóm')}
    </button>
  );
}
