import fs from "fs";
import path from "path";

const PHOTO_DIR = path.join(process.cwd(), "public", "images", "destinations");
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/**
 * Looks for a real local photo for this destination at
 * public/images/destinations/<slug>.{jpg,jpeg,png,webp}.
 *
 * Returns the public URL path if a file exists, otherwise null so callers
 * can fall back to the generative destination art. This means dropping a
 * correctly named real photo into that folder is the ONLY step needed to
 * switch a city over to real photography — no component changes required.
 */
export function getDestinationPhotoPath(slug: string): string | null {
  for (const ext of EXTENSIONS) {
    const filePath = path.join(PHOTO_DIR, `${slug}${ext}`);
    if (fs.existsSync(filePath)) {
      return `/images/destinations/${slug}${ext}`;
    }
  }
  return null;
}
