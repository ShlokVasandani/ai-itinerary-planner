/** Placeholder for the trip summary and the first two days. Same footprint as the real cards, so nothing jumps when the plan lands. */
export default function PlanSkeleton({ label }: { label: string }) {
  return (
    <div className="plan-skeleton" role="status" aria-live="polite">
      <p className="sr-only">{label}</p>
      <div className="skel-card" aria-hidden="true">
        <span className="skel skel-line skel-w40 skel-h28" />
        <span className="skel skel-line skel-w70" />
        <div className="skel-stats">
          <span className="skel skel-block" />
          <span className="skel skel-block" />
          <span className="skel skel-block" />
        </div>
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="skel-card" aria-hidden="true" style={{ ["--i" as string]: i }}>
          <span className="skel skel-line skel-w20" />
          <span className="skel skel-line skel-w50 skel-h24" />
          {[0, 1, 2].map((r) => (
            <div key={r} className="skel-stop">
              <span className="skel skel-dot" />
              <span className="skel-stop-lines">
                <span className="skel skel-line skel-w60" />
                <span className="skel skel-line skel-w90" />
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
