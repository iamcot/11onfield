'use client';

/** Six-corner radar: the player's values (lime), optionally the position average (dashed gold). */
export default function Radar({
  values,
  average,
  labels = [],
  size = 300,
  small = false,
  title,
}: {
  values: number[];
  average?: number[] | null;
  labels?: string[];
  size?: number;
  small?: boolean;
  title?: string;
}) {
  const c = size / 2;
  const R = size * (small ? 0.42 : 0.32);
  const n = values.length || 6;
  const pt = (i: number, v: number): [number, number] => {
    const a = ((i * 360) / n - 90) * (Math.PI / 180);
    return [c + ((R * v) / 100) * Math.cos(a), c + ((R * v) / 100) * Math.sin(a)];
  };
  const poly = (v: number[]) => v.map((x, i) => pt(i, x).join(',')).join(' ');
  const ring = (l: number) => poly(Array.from({ length: n }, () => l));
  const pad = small ? 4 : 34;
  return (
    <svg
      className="pp-radar"
      viewBox={`${-pad} -8 ${size + pad * 2} ${size + 16}`}
      role="img"
      aria-label={title}
      style={small ? { width: '100%', height: '100%' } : undefined}
    >
      {[25, 50, 75, 100].map((l) => (
        <polygon key={l} points={ring(l)} fill={l === 100 ? 'rgba(166,227,90,.05)' : 'none'} stroke={`rgba(255,255,255,${l === 100 ? 0.22 : 0.09})`} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgba(255,255,255,.09)" />;
      })}
      {average && <polygon points={poly(average)} fill="none" stroke="#e3c27e" strokeWidth={1.6} strokeDasharray="5 4" />}
      <g className="shape" style={{ transformOrigin: `${c}px ${c}px` }}>
        <polygon points={poly(values)} fill="rgba(166,227,90,.28)" stroke="#c4f47e" strokeWidth={small ? 1.6 : 2.4} strokeLinejoin="round" />
        {values.map((v, i) => {
          const [x, y] = pt(i, v);
          return <circle key={i} cx={x} cy={y} r={small ? 2 : 4} fill="#eaffc9" />;
        })}
      </g>
      {!small &&
        labels.map((l, i) => {
          const [x, y] = pt(i, 128);
          const anchor = Math.abs(x - c) < 2 ? 'middle' : x > c ? 'start' : 'end';
          return (
            <g key={i}>
              <text x={x} y={y - 4} textAnchor={anchor} fill="#b4c4ba" fontSize={12} style={{ fontFamily: 'var(--f-body)' }}>
                {l}
              </text>
              <text x={x} y={y + 14} textAnchor={anchor} fill="#fff" fontWeight={800} fontSize={20} style={{ fontFamily: 'var(--f-display)' }}>
                {values[i]}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
