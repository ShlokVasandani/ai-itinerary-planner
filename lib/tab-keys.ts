/**
 * Which tab a key moves to, following the ARIA tabs pattern with automatic activation:
 * Left/Right move one tab and wrap around, Home/End jump to the ends. Any other key returns undefined.
 */
export function nextTabIndex(key: string, current: number, count: number): number | undefined {
  if (count <= 0) return undefined;
  switch (key) {
    case "ArrowRight":
      return (current + 1) % count;
    case "ArrowLeft":
      return (current - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return undefined;
  }
}
