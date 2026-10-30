// Allow-list sanitizer for short rich text written in the admin (e.g. a player's bio).
// Players can also type their bio, so anything outside this list is dropped before rendering as HTML.
const TAGS = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'UL', 'OL', 'LI', 'A', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'SPAN']);

export function looksLikeHtml(s: string) {
  return /<\/?[a-z][\s\S]*>/i.test(s);
}

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return '';
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (!TAGS.has(child.tagName)) {
        // keep the text of unknown inline tags, drop scripts/styles entirely
        if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED'].includes(child.tagName)) child.remove();
        else child.replaceWith(...Array.from(child.childNodes));
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const keep = child.tagName === 'A' && attr.name === 'href' && /^https?:\/\//i.test(attr.value);
        if (!keep) child.removeAttribute(attr.name);
      }
      if (child.tagName === 'A') {
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noopener noreferrer nofollow');
      }
      walk(child);
    }
  };
  const root = doc.body.firstElementChild as Element;
  // unwrapping can surface new children, so walk until stable
  let before = '';
  while (before !== root.innerHTML) {
    before = root.innerHTML;
    walk(root);
  }
  return root.innerHTML;
}

/** Plain text (as players type it) to paragraphs, so the rich-text editor keeps the line breaks. */
export function textToHtml(s: string): string {
  if (!s || looksLikeHtml(s)) return s;
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return s.split(/\n{2,}/).map((para) => `<p>${esc(para).replace(/\n/g, '<br>')}</p>`).join('');
}
