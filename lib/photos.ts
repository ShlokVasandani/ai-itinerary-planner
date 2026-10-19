import manifest from "./photo-manifest.json";
import openPhotos from "./data/open/photos.json";
import { cityPhotos } from "./city-photo-urls";

export interface PhotoInfo {
  width: number;
  height: number;
  widths: number[];
  blur: string;
}

export interface PhotoCredit {
  alt: string;
  credit: string;
  license: string;
  sourcePage: string;
  commonsFilename: string;
}

export const photoManifest = manifest as Record<string, PhotoInfo>;
const open = openPhotos as unknown as Record<string, PhotoInfo & PhotoCredit>;

export function getPhoto(slug: string): PhotoInfo | undefined {
  return photoManifest[slug] ?? open[slug];
}

/** Credit, license and alt text for a city photo, whether curated or from the open-data catalog. */
export function getPhotoCredit(slug: string): PhotoCredit | undefined {
  return cityPhotos[slug] ?? open[slug];
}

export function photoSrcSet(slug: string, format: "avif" | "webp", widths: number[]): string {
  return widths.map((w) => `/images/destinations/${slug}-${w}.${format} ${w}w`).join(", ");
}
