import PlanSkeleton from "@/components/PlanSkeleton";

/**
 * Shown the instant /planner is requested. The page reads searchParams, so it renders on demand;
 * without this the landing page looks frozen after "Plan my trip" until the server answers.
 */
export default function PlannerLoading() {
  return (
    <main className="planner-page" aria-busy="true">
      <header className="planner-hero planner-hero-loading">
        <div className="planner-hero-text" aria-hidden="true">
          <span className="skel skel-line skel-w30" />
          <span className="skel skel-line skel-w70 skel-h56" />
          <span className="skel skel-line skel-w90" />
        </div>
      </header>
      <div className="planner planner-layout">
        <aside className="planner-side" aria-hidden="true">
          <div className="skel-form">
            <span className="skel skel-field" />
            <span className="skel skel-field" />
            <span className="skel skel-line skel-w30" />
            <span className="skel skel-field skel-h40" />
            <span className="skel skel-line skel-w30" />
            <span className="skel skel-field skel-h40" />
            <span className="skel skel-field skel-h46" />
          </div>
        </aside>
        <div className="planner-main">
          <PlanSkeleton label="Loading the planner" />
        </div>
      </div>
    </main>
  );
}
