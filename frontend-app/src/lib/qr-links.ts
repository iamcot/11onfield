/** What a scanned QR leads to inside the app: a profile (opened and followed) or a stage check-in. */
export type ScanTarget = { kind: 'profile' | 'checkin'; href: string };

/** Link to a profile, as shared by its QR. */
export const profileLink = (origin: string, userid: string) => `${origin}/profile/${encodeURIComponent(userid)}`;

/**
 * Reads a scanned text. Only the path matters, so a code made on another of our hosts (test, production) works too.
 * Anything else is not ours and is refused.
 */
export function parseScan(text: string): ScanTarget | null {
  let url: URL;
  try {
    url = new URL(text.trim(), 'https://x.invalid');
  } catch {
    return null;
  }
  if (url.pathname.replace(/\/$/, '') === '/check-in') {
    const code = url.searchParams.get('c');
    return code ? { kind: 'checkin', href: `/check-in?c=${encodeURIComponent(code)}` } : null;
  }
  const m = url.pathname.match(/^\/profile\/([^/]+)\/?$/);
  if (m) return { kind: 'profile', href: `/profile/${m[1]}?follow=1` };
  return null;
}
