import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import { OG_SIZE } from '@/lib/og/PlayerCardImage';
import { OG_LOCALE } from '@/lib/og/meta';
import { fetchProfile } from '@/lib/og/server';
import { overall, posGroup, proStats, profileStats, type StatAttribute } from '@/lib/players/stats';

/** Link preview of a profile: "{player} - 11 người ra sân", a call to join and back the player, the player card. */
export async function generateMetadata({ params }: { params: { userid: string } }): Promise<Metadata> {
  const { locale, t } = getT();
  const profile = await fetchProfile(params.userid);
  if (!profile) return {};

  const brand = t('11 người ra sân');
  const name = profile.fullName;
  const title = `${name} - ${brand}`;
  const description = t('Cùng tham gia 11 người ra sân và tiếp sức {name} chinh phục ước mơ sân cỏ!', { name });
  const path = `/profile/${encodeURIComponent(profile.userid)}`;
  // a new image URL whenever what the card shows changes, so apps that cache previews pick it up
  const group = posGroup(profile.positions);
  const ovr = overall(proStats(profile.attributes as StatAttribute[] | undefined, group === 'GK') ?? profileStats(profile.profileStats as StatAttribute[] | undefined));
  const version = [profile.avatar, name, group, ovr].join('|');
  let hash = 0;
  for (let i = 0; i < version.length; i++) hash = (hash * 31 + version.charCodeAt(i)) | 0;
  const image = { url: `${path}/card?v=og&h=${(hash >>> 0).toString(36)}`, ...OG_SIZE, alt: name };

  return {
    title: { absolute: title },
    description,
    openGraph: { type: 'profile', locale: OG_LOCALE[locale], siteName: brand, url: path, title, description, images: [image] },
  };
}

export default function PlayerProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
