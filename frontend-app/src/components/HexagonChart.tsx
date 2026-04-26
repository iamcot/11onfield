"use client";

interface PlayerAttribute {
  attributeKey: string;
  attributeName: string;
  attributeValue: number;
  attributeGroup?: string;
  isHexagon?: boolean;
  isGoalKeeper?: boolean;
}

interface HexagonChartProps {
  attributes: PlayerAttribute[];
  size?: number;
  showLabels?: boolean;
  showValues?: boolean;
  labelFontSize?: number;
  className?: string;
}

export default function HexagonChart({
  attributes,
  size = 400,
  showLabels = true,
  showValues = true,
  labelFontSize = 12,
  className = "",
}: HexagonChartProps) {
  // Filter and get up to 6 hexagon attributes
  const hexagonAttrs = attributes.filter((attr) => attr.isHexagon).slice(0, 6);

  // If no attributes, show empty state
  if (hexagonAttrs.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <p className="text-gray-400 text-sm">Chưa có dữ liệu chỉ số</p>
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.25;
  const labelRadius = size * 0.38;
  const angles = [0, 60, 120, 180, 240, 300]; // degrees

  // Calculate background hexagon points
  const bgPoints = angles
    .map((angle) => {
      const rad = ((angle - 90) * Math.PI) / 180;
      return `${cx + radius * Math.cos(rad)},${cy + radius * Math.sin(rad)}`;
    })
    .join(" ");

  // Calculate data hexagon points (scaled by attribute values)
  const dataPoints = angles
    .map((angle, i) => {
      const value = hexagonAttrs[i]?.attributeValue || 0;
      const r = (value / 100) * radius;
      const rad = ((angle - 90) * Math.PI) / 180;
      return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
    })
    .join(" ");

  // Calculate axis lines
  const axisLines = angles.map((angle, i) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    const x2 = cx + radius * Math.cos(rad);
    const y2 = cy + radius * Math.sin(rad);
    return (
      <line
        key={`axis-${i}`}
        x1={cx}
        y1={cy}
        x2={x2}
        y2={y2}
        stroke="#e5e7eb"
        strokeWidth="1"
      />
    );
  });

  // Calculate label positions
  const labels =
    showLabels &&
    angles.map((angle, i) => {
      const attr = hexagonAttrs[i];
      if (!attr) return null;

      const rad = ((angle - 90) * Math.PI) / 180;
      const x = cx + labelRadius * Math.cos(rad);
      const y = cy + labelRadius * Math.sin(rad);

      return (
        <g key={`label-${i}`}>
          <text
            x={x}
            y={showValues ? y : y + 7}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-700"
            style={{ fontSize: `${labelFontSize}px`, fontWeight: "normal" }}
          >
            {attr.attributeName}
          </text>
          {showValues && (
            <text
              x={x}
              y={y + 14}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-green-600"
              style={{ fontSize: "11px", fontWeight: "normal" }}
            >
              {attr.attributeValue}
            </text>
          )}
        </g>
      );
    });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      {/* Axis lines */}
      {axisLines}

      {/* Background hexagon */}
      <polygon
        points={bgPoints}
        fill="#f9fafb"
        stroke="#d1d5db"
        strokeWidth="2"
      />

      {/* Data hexagon */}
      {hexagonAttrs.length > 0 && (
        <polygon
          points={dataPoints}
          fill="rgba(34, 197, 94, 0.3)"
          stroke="#22c55e"
          strokeWidth="3"
        />
      )}

      {/* Labels */}
      {labels}
    </svg>
  );
}
