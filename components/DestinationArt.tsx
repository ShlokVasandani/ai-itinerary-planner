import { getCityArtSpec } from "@/lib/city-art";

interface Props {
  slug: string;
  variant?: "card" | "hero";
  className?: string;
}

export default function DestinationArt({ slug, variant = "card", className }: Props) {
  const isHero = variant === "hero";
  const width = isHero ? 1200 : 400;
  const height = isHero ? 380 : 200;
  const barCount = isHero ? 18 : 10;
  const spec = getCityArtSpec(slug, barCount);
  const { palette, bars, glowX, glowY } = spec;

  const gradId = `sky-${slug}-${variant}`;
  const glowId = `glow-${slug}-${variant}`;
  const barWidth = width / barCount;
  const baseline = height * 0.82;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`city-art${isHero ? " city-art-hero" : ""}${className ? ` ${className}` : ""}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.from} />
          <stop offset="100%" stopColor={palette.to} />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.glow} stopOpacity="0.55" />
          <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={width} height={height} fill={`url(#${gradId})`} />

      {/* Ambient glow — sun or moon depending on the palette's warmth */}
      <circle cx={width * glowX} cy={height * glowY} r={isHero ? 160 : 70} fill={`url(#${glowId})`} />
      <circle
        cx={width * glowX}
        cy={height * glowY}
        r={isHero ? 30 : 14}
        fill={palette.glow}
        opacity={palette.warm ? 0.9 : 0.55}
      />

      {/* Dotted flight-path arc — echoes the itinerary timeline's route line */}
      <path
        d={`M ${width * 0.05} ${height * 0.35} Q ${width * 0.5} ${height * 0.02} ${width * 0.95} ${height * 0.4}`}
        fill="none"
        stroke={palette.line}
        strokeOpacity="0.35"
        strokeWidth={isHero ? 2 : 1.4}
        strokeDasharray="1 9"
        strokeLinecap="round"
      />

      {/* Abstract skyline silhouette, unique per city via seeded heights */}
      <g opacity="0.92">
        {bars.map((h, i) => {
          const barHeight = h * height * 0.5;
          return (
            <rect
              key={i}
              x={i * barWidth + barWidth * 0.12}
              y={baseline - barHeight}
              width={barWidth * 0.76}
              height={barHeight}
              rx={isHero ? 2 : 1.5}
              fill={palette.from}
              stroke={palette.line}
              strokeOpacity="0.4"
              strokeWidth={isHero ? 1 : 0.75}
            />
          );
        })}
      </g>

      {/* Horizon line */}
      <line x1="0" y1={baseline} x2={width} y2={baseline} stroke={palette.line} strokeOpacity="0.25" strokeWidth="1" />

      {/* Bottom fade so overlaid text stays legible on the hero variant */}
      {isHero && (
        <rect width={width} height={height} fill={`url(#fade-${slug})`} />
      )}
      {isHero && (
        <defs>
          <linearGradient id={`fade-${slug}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="55%" stopColor={palette.to} stopOpacity="0" />
            <stop offset="100%" stopColor={palette.to} stopOpacity="0.55" />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
}
