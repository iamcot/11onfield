import { Fragment, type ReactNode } from 'react';

/**
 * Render a translated string that carries inline markup, e.g.
 * `rich(t('Đồng ý với <link>điều khoản</link>'), { link: (c) => <a href="/terms">{c}</a> })`.
 * Tags are not nested.
 */
export function rich(text: string, tags: Record<string, (chunk: string) => ReactNode>): ReactNode {
  const parts: ReactNode[] = [];
  const re = /<(\w+)>(.*?)<\/\1>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const render = tags[m[1]];
    parts.push(<Fragment key={m.index}>{render ? render(m[2]) : m[2]}</Fragment>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
