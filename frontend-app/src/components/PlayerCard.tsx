"use client";

interface PlayerAttribute {
  attributeKey: string;
  attributeName: string;
  attributeValue: number;
  attributeGroup?: string;
  isHexagon?: boolean;
  isGoalKeeper?: boolean;
}

interface PlayerCardProps {
  avatar: string | null;
  fullName: string;
  positions: string[];
  preferredFoot?: string | null;
  attributes?: PlayerAttribute[];
  className?: string;
}

// Map position to short key
function getPositionKey(position: string): string {
  const positionKeyMap: Record<string, string> = {
    striker: "ST",
    midfielder: "MF",
    centerback: "CB",
    defender: "DF",
    goalkeeper: "GK",
  };
  return positionKeyMap[position] || position.substring(0, 2).toUpperCase();
}

export default function PlayerCard({
  avatar,
  fullName,
  positions,
  preferredFoot,
  attributes = [],
  className = "",
}: PlayerCardProps) {
  // Filter hexagon attributes and get first 6
  const hexagonAttrs = attributes.filter((attr) => attr.isHexagon).slice(0, 6);

  // Ensure we always have 6 items to display
  const displayAttrs = [...hexagonAttrs];
  while (displayAttrs.length < 6) {
    displayAttrs.push({
      attributeKey: `placeholder-${displayAttrs.length}`,
      attributeName: `Chỉ số ${displayAttrs.length + 1}`,
      attributeValue: -1, // Use -1 as placeholder indicator
      isHexagon: true,
    });
  }

  // Calculate overall score (average of hexagon attributes with real values)
  const overallScore =
    hexagonAttrs.length > 0
      ? Math.round(
          hexagonAttrs.reduce((sum, attr) => sum + attr.attributeValue, 0) /
            hexagonAttrs.length,
        )
      : 0;

  // Get primary position key
  const positionKey =
    positions.length > 0 ? getPositionKey(positions[0]) : "N/A";

  // Get first initial for avatar fallback
  const initial = fullName ? fullName.charAt(0).toUpperCase() : "?";

  return (
    <div
      className={`relative w-64 bg-gradient-to-br from-green-900 via-green-800 to-green-950 rounded-xl overflow-hidden shadow-2xl border-2 border-green-700 ${className}`}
    >
      {/* Top Row: Avatar as Background with Overall Score & Position */}
      <div className="relative h-32 md:h-40 overflow-hidden">
        {/* Avatar Background - offset to the right by 1/4 width */}
        {avatar ? (
          <div className="absolute top-0 bottom-0 left-1/4 right-0">
            <img
              src={avatar}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="absolute top-0 bottom-0 left-1/4 right-0 bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center">
            <span className="text-green-300 font-bold text-6xl opacity-30">
              {initial}
            </span>
          </div>
        )}

        {/* Left gradient overlay - fades from solid to transparent */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-green-950 via-green-950/80 to-transparent"
          style={{ width: "40%" }}
        ></div>

        {/* Dark overlay on avatar for better contrast */}
        <div className="absolute top-0 bottom-0 left-1/4 right-0 bg-gradient-to-r from-black/40 to-transparent"></div>

        {/* Overall Score, Position & Preferred Foot - centered in first 1/4 */}
        <div className="absolute left-0 top-0 bottom-0 w-1/4 flex flex-col items-center justify-center gap-1 z-10">
          {/* Overall Score - No Border */}
          <div className="flex items-center justify-center">
            <div className="text-3xl font-bold leading-none text-yellow-400">
              {overallScore}
            </div>
          </div>

          {/* Position Key - No Border */}
          <div className="flex items-center justify-center">
            <div className="text-lg font-bold leading-none text-green-300">
              {positionKey}
            </div>
          </div>

          {/* Preferred Foot Text */}
          {preferredFoot && (
            <div className="flex items-center justify-center">
              <div className="text-lg font-bold leading-none text-green-200">
                {preferredFoot === "left"
                  ? "L"
                  : preferredFoot === "right"
                    ? "R"
                    : "LR"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle Row: Player Name */}
      <div className="px-4 py-3 bg-gradient-to-r from-green-900/50 to-green-950/50">
        <h3 className="text-white font-bold text-[10px] md:text-sm tracking-wide uppercase text-center truncate">
          {fullName}
        </h3>
      </div>

      {/* Bottom Row: 6 Hexagon Attributes in 2 Columns */}
      <div className="px-4 py-3 bg-green-950/30">
        <div className="grid grid-cols-2 gap-x-2 md:gap-x-4 gap-y-2">
          {displayAttrs.map((attr) => {
            // Use attribute key uppercased
            const label = attr.attributeKey
              ? attr.attributeKey.toUpperCase()
              : "N/A";
            // Check if this is a placeholder
            const isPlaceholder = attr.attributeValue === -1;
            return (
              <div
                key={attr.attributeKey}
                className={`flex items-center justify-center gap-1 h-5 md:h-6 ${isPlaceholder ? "opacity-0" : ""}`}
              >
                <span className="text-green-400 font-bold text-sm md:text-base text-right w-7 md:w-8 font-mono">
                  {isPlaceholder ? "N/A" : attr.attributeValue}
                </span>
                <span className="text-green-200 text-sm md:text-sm font-medium text-left font-mono">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-green-500/20 to-transparent rounded-bl-full"></div>
    </div>
  );
}
