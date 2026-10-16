import manifest from "./photo-manifest.json";

export interface PhotoInfo {
  width: number;
  height: number;
  widths: number[];
  blur: string;
}

export const photoManifest = manifest as Record<string, PhotoInfo>;

export function getPhoto(slug: string): PhotoInfo | undefined {
  return photoManifest[slug];
}

export function photoSrcSet(slug: string, format: "avif" | "webp", widths: number[]): string {
  return widths.map((w) => `/images/destinations/${slug}-${w}.${format} ${w}w`).join(", ");
}
