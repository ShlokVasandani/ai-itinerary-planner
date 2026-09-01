import DestinationArt from "@/components/DestinationArt";
import { getDestinationPhotoPath } from "@/lib/destination-photo";
import { getCityPhotoUrl, cityPhotos } from "@/lib/city-photo-urls";

interface Props {
  slug: string;
  city: string;
  variant?: "card" | "hero";
  priority?: boolean;
}

/**
 * Picks the best available image for a destination, in order:
 *   1. A real local file at public/images/destinations/<slug>.*, if present.
 *   2. A verified real photo hotlinked from Wikimedia Commons (see
 *      lib/city-photo-urls.ts — every entry was individually confirmed
 *      against the live Commons site, with its license recorded).
 *   3. The generative destination art, as a last-resort fallback so a
 *      missing/renamed Commons file never breaks the page.
 *
 * Plain <img> is used (not next/image) for the two photo cases so no
 * next.config remote-domain allowlisting is required for a single source.
 */
export default function DestinationMedia({ slug, city, variant = "card", priority = false }: Props) {
  const localPhoto = getDestinationPhotoPath(slug);
  if (localPhoto) {
    return (
      <img
        src={localPhoto}
        alt={city}
        className="city-photo"
        loading={priority ? "eager" : "lazy"}
      />
    );
  }

  const remotePhoto = getCityPhotoUrl(slug);
  if (remotePhoto) {
    return (
      <img
        src={remotePhoto}
        alt={cityPhotos[slug]?.alt ?? city}
        className="city-photo"
        loading={priority ? "eager" : "lazy"}
        referrerPolicy="no-referrer"
      />
    );
  }

  // No photo available for this city at all — fall back to generative art.
  return <DestinationArt slug={slug} variant={variant} />;
}
