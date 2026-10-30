import type { TripProblem } from "@/lib/trip-problem";

/** Shown instead of a plan that has no sightseeing in it. Reuses the planner's empty-state look. */
export default function TightTripNotice({ problem }: { problem: TripProblem }) {
  return (
    <div className="planner-empty" role="status">
      <h2>{problem.title}</h2>
      <p>{problem.message}</p>
      <p className="tight-change">
        Change: {problem.change.map((c, i) => (
          <span key={c}>
            {i > 0 && ", "}
            <strong>{c}</strong>
          </span>
        ))}
      </p>
    </div>
  );
}
