"use client";

import DestinationArt from "@/components/DestinationArt";
import { getCityPhotoUrl, cityPhotos } from "@/lib/city-photo-urls";

interface Props {
  slug: string;
  city: string;
  variant?: "card" | "hero";
}

/**
 * Same fallback idea as DestinationMedia, minus the local-file check (which
 * needs Node's `fs` and can only run in a server component). Used inside
 * client components — currently just the planner's live destination preview.
 */
export default function ClientDestinationMedia({ slug, city, variant = "card" }: Props) {
  const remotePhoto = getCityPhotoUrl(slug);
  if (remotePhoto) {
    return (
      <img
        src={remotePhoto}
        alt={cityPhotos[slug]?.alt ?? city}
        className="city-photo"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }
  return <DestinationArt slug={slug} variant={variant} />;
}
