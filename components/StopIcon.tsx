interface Props {
  kind: string;
  size?: number;
  className?: string;
}

/**
 * Minimal, single-weight line icons for each itinerary stop kind — replaces
 * emoji so the timeline reads as a designed system rather than a chat log.
 * All icons share a 24x24 viewBox, 1.6 stroke, round caps/joins, no fill,
 * so they inherit color cleanly from their parent (see .timeline-dot).
 */
export default function StopIcon({ kind, size = 15, className }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (kind) {
    case "breakfast":
      // sunrise
      return (
        <svg {...common}>
          <circle cx="12" cy="14" r="4" />
          <path d="M3 20h18M2 14h1M21 14h1M5.5 7.5l.9.9M17.6 8.4l.9-.9M12 4v2" />
        </svg>
      );
    case "lunch":
    case "dinner":
      // fork & knife
      return (
        <svg {...common}>
          <path d="M6 3v7a2 2 0 0 0 2 2v9M6 3v4M8 3v4M6 10a2 2 0 0 1-2-2V3M18 3c-1.5 1-2 3-2 5s.5 3 2 4v9M18 3v9" />
        </svg>
      );
    case "coffee":
      return (
        <svg {...common}>
          <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
          <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
          <path d="M7 4c0 1-1 1-1 2M11 4c0 1-1 1-1 2" />
        </svg>
      );
    case "landmark":
      // building / monument
      return (
        <svg {...common}>
          <path d="M12 3l7 5H5l7-5Z" />
          <path d="M6 10v9M10 10v9M14 10v9M18 10v9M4 21h16" />
        </svg>
      );
    case "experience":
      // spark / star
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "shopping":
      return (
        <svg {...common}>
          <path d="M6 8h12l-1 12H7L6 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case "nightlife":
      return (
        <svg {...common}>
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
        </svg>
      );
    case "transit":
      return (
        <svg {...common}>
          <path d="M4 12h14M13 7l5 5-5 5" />
        </svg>
      );
    case "day-trip":
      return (
        <svg {...common}>
          <path d="M4 16h16M5 16l1.5-5a2 2 0 0 1 2-1.4h7a2 2 0 0 1 2 1.4L19 16" />
          <circle cx="8" cy="18.5" r="1.5" />
          <circle cx="16" cy="18.5" r="1.5" />
        </svg>
      );
    case "free-time":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 2.5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}
