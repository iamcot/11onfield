'use client';

// Big touch keypad and spinner shared by the station scoring screens.
const INK = 'text-[#06140D]';

export function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Keypad({ onKey, allowDot }: { onKey: (k: string) => void; allowDot: boolean }) {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', allowDot ? '.' : '', '0', '⌫'];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((k, i) =>
        k ? (
          <button
            key={i}
            type="button"
            onClick={() => onKey(k)}
            className={`h-[68px] rounded-xl border-2 border-[#0B2419]/20 bg-white font-[family-name:var(--font-hud)] text-[30px] font-bold ${INK} shadow-[0_2px_0_rgba(11,36,25,0.18)] active:translate-y-[1px] active:bg-[#E4F3D6] active:shadow-none`}
            aria-label={k === '⌫' ? 'Xoá một ký tự' : k}
          >
            {k}
          </button>
        ) : (
          <span key={i} />
        ),
      )}
      <button type="button" onClick={() => onKey('C')} className={`col-span-3 h-[52px] rounded-xl border-2 border-[#0B2419]/20 bg-white text-[17px] font-semibold ${INK} active:bg-[#FDE4E1]`}>
        Xoá ô đang chọn
      </button>
    </div>
  );
}

