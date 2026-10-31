import { outboundRel } from "@/lib/providers/affiliateConfig";
import type { Offer } from "@/lib/providers/types";

interface Props {
  offer: Pick<Offer, "url" | "isAffiliate" | "title">;
  className?: string;
  children?: React.ReactNode;
}

/** External link that always opens in a new tab and marks affiliate links as sponsored. */
export default function OutboundLink({ offer, className, children }: Props) {
  return (
    <a href={offer.url} target="_blank" rel={outboundRel(!!offer.isAffiliate)} className={className}>
      {children ?? offer.title}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
