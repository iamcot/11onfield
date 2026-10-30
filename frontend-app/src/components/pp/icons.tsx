// Small stroke icons of the player pages (aria-hidden: every button that uses one also has a text or a label).
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true } as const;

export const IconPrev = () => <svg {...base} strokeWidth={2.2}><path d="m15 6-6 6 6 6" /></svg>;
export const IconNext = () => <svg {...base} strokeWidth={2.2}><path d="m9 6 6 6-6 6" /></svg>;
export const IconClose = () => <svg {...base}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const IconSearch = () => <svg {...base}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const IconList = () => <svg {...base}><path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1" /></svg>;
export const IconCards = () => <svg {...base}><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="9" /><rect x="3" y="15" width="7" height="6" /><rect x="14" y="15" width="7" height="6" /></svg>;
export const IconPitch = () => <svg {...base}><rect x="3" y="3" width="18" height="18" /><path d="M3 12h18" /><circle cx="12" cy="12" r="3" /></svg>;
export const IconArrow = () => <svg {...base} strokeWidth={2.4}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const IconPen = () => <svg {...base}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m14 6 4 4" /></svg>;
export const IconCamera = () => <svg {...base}><path d="M4 7h3l2-3h6l2 3h3v13H4z" /><circle cx="12" cy="13" r="4" /></svg>;
export const IconUpload = () => <svg {...base}><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>;
export const IconPlay = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z" /></svg>;
export const IconCheck = () => <svg {...base} strokeWidth={3}><path d="m5 12 5 5 9-10" /></svg>;
export const IconShield = () => <svg {...base}><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z" /></svg>;
export const IconTrophy = () => <svg {...base}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg>;
export const IconHex = () => <svg {...base} strokeWidth={1.8}><path d="M12 2 3 7v10l9 5 9-5V7z" /><path d="M12 8v5M12 16v.5" /></svg>;
export const IconDrag = () => <svg {...base}><path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" /></svg>;
export const IconShare = () => <svg {...base}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>;
