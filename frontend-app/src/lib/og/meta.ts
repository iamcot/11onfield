import type { Locale } from '@/i18n/config';

// Link preview (Open Graph) pieces shared by the root layout and the pages with their own preview.

export const OG_LOCALE: Record<Locale, string> = { vi: 'vi_VN', en: 'en_GB', es: 'es_ES', ko: 'ko_KR' };

/** Logo on the stadium, for every page without a picture of its own. */
export const DEFAULT_SHARE_IMAGE = { url: '/images/og-default.jpg', width: 1200, height: 630, alt: '11 On Field' };

/** Short introduction of the programme: the description of pages that have none (Vietnamese key, translate it). */
export const SITE_INTRO =
  '11 người ra sân là chương trình tuyển trạch cầu thủ trẻ toàn quốc, đưa tài năng từ đường phố đến sân cỏ. Tạo hồ sơ cầu thủ miễn phí và ghi dấu ấn qua từng vòng tuyển chọn.';
