interface Props {
  priority: string;
  size?: number;
  className?: string;
}

/**
 * Minimal line icons for the four priority levels (must-see, highly
 * recommended, interest-specific, if-you-have-time). Same conventions as
 * StopIcon/NoteIcon: 24x24 viewBox, single stroke weight, currentColor.
 */
export default function PriorityIcon({ priority, size = 13, className }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (priority) {
    case "must-see":
      // filled-weight flame outline — highest priority
      return (
        <svg {...common}>
          <path d="M12 21c4 0 6-2.7 6-6.2 0-2.7-1.7-4.6-2.8-6.3-.3 1.4-1.1 2.4-2 2.4-1.4 0-1-2-.5-3.4C13.4 5.6 12.6 3 12 3c-.7 3-4 5.4-4 9.4C8 17 9.5 21 12 21Z" />
        </svg>
      );
    case "highly-recommended":
      return (
        <svg {...common}>
          <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
        </svg>
      );
    case "interest-specific":
      // target
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="0.5" fill="currentColor" />
        </svg>
      );
    default:
      // if-you-have-time — plus
      return (
        <svg {...common}>
          <path d="M12 6v12M6 12h12" />
        </svg>
      );
  }
}
