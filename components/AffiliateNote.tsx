/** Short, always-visible disclosure that sits next to booking buttons. */
export default function AffiliateNote({ className = "" }: { className?: string }) {
  return (
    <span className={`affiliate-note ${className}`}>
      <abbr title="Some booking links may earn Sekai a commission at no extra cost to you. Official venue links never do.">
        Affiliate links
      </abbr>
    </span>
  );
}
