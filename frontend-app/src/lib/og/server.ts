import 'server-only';
import { readFile } from 'fs/promises';
import path from 'path';
import { headers } from 'next/headers';
import { backendUrl } from '@/lib/admin/session';
import type { UserProfile } from '@/services/user.service';

// Server side of link previews and the downloadable player card. Only .next and public/ are deployed,
// so fonts and images are read from public/.
const PUBLIC_DIR = path.join(process.cwd(), 'public');

/** https://11onfield.com, from NEXT_PUBLIC_SITE_URL or the request (nginx passes Host and X-Forwarded-Proto). */
export function siteOrigin(): string {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL;
  if (fixed) return fixed.replace(/\/+$/, '');
  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:7070';
  const local = /^(localhost|127\.|10\.|192\.168\.)/.test(host);
  const proto = h.get('x-forwarded-proto')?.split(',')[0] || (local ? 'http' : 'https');
  return `${proto}://${host}`;
}

/** Public profile, or null when the user does not exist (or the API is down). Cached a minute. */
export async function fetchProfile(userid: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${backendUrl()}/users/${encodeURIComponent(userid)}`, { next: { revalidate: 60 } });
    return res.ok ? ((await res.json()) as UserProfile) : null;
  } catch {
    return null;
  }
}

let fonts: Promise<{ name: string; data: Buffer; weight: 600 | 700 | 800; style: 'normal' }[]> | null = null;

/** Barlow Condensed (display) and Chakra Petch (HUD), the fonts of the in-app card. */
export function cardFonts() {
  fonts ??= Promise.all([
    readFile(path.join(PUBLIC_DIR, 'fonts/og/BarlowCondensed-ExtraBold.ttf')).then((data) => ({ name: 'Display', data, weight: 800 as const, style: 'normal' as const })),
    readFile(path.join(PUBLIC_DIR, 'fonts/og/ChakraPetch-SemiBold.ttf')).then((data) => ({ name: 'Hud', data, weight: 600 as const, style: 'normal' as const })),
    readFile(path.join(PUBLIC_DIR, 'fonts/og/ChakraPetch-Bold.ttf')).then((data) => ({ name: 'Hud', data, weight: 700 as const, style: 'normal' as const })),
  ]);
  return fonts;
}

const MIME: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

/** A file of public/ as a data URI. */
export async function publicImage(file: string): Promise<string> {
  const data = await readFile(path.join(PUBLIC_DIR, file));
  return `data:${MIME[path.extname(file)] ?? 'image/png'};base64,${data.toString('base64')}`;
}

/**
 * A remote image (the player's photo) as a data URI. The renderer only reads PNG and JPEG, so anything else
 * (WebP) or a slow or failed download gives null and the card shows the initials instead.
 */
export async function remoteImage(src: string | null | undefined, origin: string): Promise<string | null> {
  if (!src) return null;
  try {
    const res = await fetch(new URL(src, origin), { signal: AbortSignal.timeout(5000), next: { revalidate: 300 } });
    const type = res.headers.get('content-type')?.split(';')[0].trim() ?? '';
    if (!res.ok || !['image/png', 'image/jpeg'].includes(type)) return null;
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
  } catch {
    return null;
  }
}
