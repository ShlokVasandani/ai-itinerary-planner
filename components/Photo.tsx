import DestinationArt from "@/components/DestinationArt";
import { cityPhotos } from "@/lib/city-photo-urls";
import { getPhoto, photoSrcSet } from "@/lib/photos";

interface Props {
  slug: string;
  city: string;
  /** `sizes` attribute for the responsive srcset. */
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Object position for cropping, e.g. "50% 40%". */
  focus?: string;
}

/**
 * A licensed destination photo served as AVIF/WebP with a srcset, intrinsic
 * width/height (no layout shift) and a blurred inline placeholder. Falls back
 * to the generative art when a city has no photo.
 */
export default function Photo({ slug, city, sizes = "(max-width: 700px) 100vw, 33vw", priority = false, className, focus }: Props) {
  const photo = getPhoto(slug);
  if (!photo) return <DestinationArt slug={slug} variant="card" />;
  const alt = cityPhotos[slug]?.alt ?? city;
  return (
    <picture>
      <source type="image/avif" srcSet={photoSrcSet(slug, "avif", photo.widths)} sizes={sizes} />
      <source type="image/webp" srcSet={photoSrcSet(slug, "webp", photo.widths)} sizes={sizes} />
      <img
        src={`/images/destinations/${slug}.jpg`}
        alt={alt}
        width={photo.width}
        height={photo.height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : undefined}
        className={className ? `photo ${className}` : "photo"}
        style={{ backgroundImage: `url(${photo.blur})`, objectPosition: focus }}
      />
    </picture>
  );
}
